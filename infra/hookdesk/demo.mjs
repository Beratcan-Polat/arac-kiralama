import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statfsSync } from 'node:fs'
import { dirname, resolve, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const runtime = resolve(root, '.runtime/hookdesk')
const envFile = resolve(runtime, 'demo.env')
const composeFile = resolve(root, 'infra/hookdesk/compose.yaml')
const dockerLocal = resolve(process.env.LOCALAPPDATA || '.', 'Programs/DockerDesktop/resources/bin/docker.exe')
const docker = existsSync(dockerLocal) ? dockerLocal : 'docker'
const childEnv = { ...process.env, PATH: dirname(docker) + delimiter + process.env.PATH }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const action = process.argv[2] || 'status'
if (!['setup', 'start', 'stop', 'status', 'smoke'].includes(action) || process.argv.length > 3) {
  throw new Error('Kullanım: node infra/hookdesk/demo.mjs setup|start|stop|status|smoke')
}
mkdirSync(runtime, { recursive: true })
function compose(args, visible = false) {
  const result = spawnSync(docker, ['compose', '--project-name', 'hookdesk-rental', '--env-file', envFile, '-f', composeFile, ...args], {
    cwd: root, env: childEnv, encoding: 'utf8', stdio: visible ? 'inherit' : 'pipe', maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`Docker işlemi başarısız: ${args.slice(0, 2).join(' ')}. Docker Desktop ve portları kontrol et.`)
  return (result.stdout || '').trim()
}
function settings() {
  return Object.fromEntries(readFileSync(envFile, 'utf8').trim().split('\n').map(line => {
    const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]
  }))
}
function init() {
  if (existsSync(envFile)) return
  const hookdesk = resolve(process.env.HOOKDESK_PATH || resolve(root, '../HookDesk'))
  if (!existsSync(resolve(hookdesk, 'backend/artisan'))) throw new Error('HookDesk klasörü bulunamadı. HOOKDESK_PATH ile yolunu belirt.')
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  let time = BigInt(Date.now()), prefix = ''
  for (let i = 0; i < 10; i++) { prefix = alphabet[Number(time % 32n)] + prefix; time /= 32n }
  const endpoint = prefix + [...randomBytes(16)].map(n => alphabet[n % 32]).join('')
  const secret = () => randomBytes(24).toString('hex')
  const config = {
    HOOKDESK_PATH: hookdesk.replaceAll('\\', '/'), DEMO_APP_KEY: 'base64:' + randomBytes(32).toString('base64'),
    HOOKDESK_API_KEY: 'hd_' + secret(), HOOKDESK_SIGNING_SECRET: 'whsec_' + secret(), HOOKDESK_DEMO_ENDPOINT_ID: endpoint,
    HOOKDESK_DB_PASSWORD: secret(), RENTAL_DB_PASSWORD: secret(), RENTAL_DB_ROOT_PASSWORD: secret(),
    RENTAL_JWT_SECRET: randomBytes(48).toString('base64'), RENTAL_DEMO_PASSWORD: secret(), DEMO_DASHBOARD_PASSWORD: secret(),
  }
  writeFileSync(envFile, Object.entries(config).map(([k,v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 })
  writeFileSync(resolve(runtime, 'giris-bilgileri.txt'),
    `Yalnızca yerel demo hesapları\n\nHookDesk: http://127.0.0.1:8090/sign-in\nE-posta: gelistirici@rental.hookdesk.test\nParola: ${config.DEMO_DASHBOARD_PASSWORD}\n\nAraç kiralama: http://127.0.0.1:8091/giris\nE-posta: musteri@example.com\nParola: ${config.RENTAL_DEMO_PASSWORD}\n\nE-posta kutusu: http://127.0.0.1:8095\n`, { mode: 0o600 })
}
async function waitFor(label, test, seconds = 180) {
  const end = Date.now() + seconds * 1000
  while (Date.now() < end) {
    try { const value = await test(); if (value) return value } catch {}
    await sleep(2000)
  }
  throw new Error(`${label} zamanında hazır olmadı`)
}
async function ready() {
  await waitFor('HookDesk', async () => (await fetch('http://127.0.0.1:8090/api/ready', { signal: AbortSignal.timeout(3000) })).ok)
  await waitFor('Araç kiralama', async () => (await fetch('http://127.0.0.1:8091/giris', { signal: AbortSignal.timeout(3000) })).ok)
}
function mysql(query) {
  return compose(['exec', '-T', 'mysql', 'sh', '-c', 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --default-character-set=utf8mb4 -u "$MYSQL_USER" "$MYSQL_DATABASE" -N -B -e "$1"', 'sh', query])
}
function snapshot() { return JSON.parse(compose(['exec', '-T', 'app', 'php', 'rental-fixture.php', 'status'])) }
async function mailCount() {
  const response = await fetch('http://127.0.0.1:8095/api/v1/messages', { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('Mailpit erişilemiyor')
  return (await response.json()).total
}
async function smoke() {
  await ready()
  const config = settings()
  const baseCount = await mailCount()
  const login = await fetch('http://127.0.0.1:8091/giris', {
    method: 'POST', redirect: 'manual', body: new URLSearchParams({ username: 'musteri@example.com', password: config.RENTAL_DEMO_PASSWORD }),
  })
  const cookie = login.headers.getSetCookie().map(v => v.split(';')[0]).join('; ')
  if (!cookie || login.status !== 302 || login.headers.get('location')?.includes('hata')) throw new Error('Demo müşteri girişi başarısız')
  const vehicleId = Number(mysql('SELECT id FROM araclar WHERE plaka="02 HD 001" LIMIT 1'))
  if (!vehicleId) throw new Error('Demo aracı bulunamadı')
  const pickup = 'Adıyaman Havalimanı'
  const home = await fetch('http://127.0.0.1:8091/araclar', { headers: { Cookie: cookie }, signal: AbortSignal.timeout(10000) })
  if (!home.ok || !(await home.text()).includes(`value="${pickup}"`)) throw new Error('Demo alış noktası müşteri formunda bulunamadı')
  const maxDate = mysql('SELECT COALESCE(MAX(iade_tarihi),CURDATE()) FROM kiralamalar')
  let day = new Date(maxDate + 'T12:00:00Z')
  if (!Number.isFinite(day.getTime())) throw new Error('Demo tarih bilgisi geçersiz')
  async function reserve() {
    day.setUTCDate(day.getUTCDate() + 2); const start = day.toISOString().slice(0, 10)
    day.setUTCDate(day.getUTCDate() + 2); const end = day.toISOString().slice(0, 10)
    const search = new URLSearchParams({ alisNoktasi: pickup, alisTarihi: start, iadeTarihi: end, alisSaati: '10:00', iadeSaati: '10:00' })
    const listing = await fetch('http://127.0.0.1:8091/araclar?' + search, { headers: { Cookie: cookie }, signal: AbortSignal.timeout(10000) })
    if (!listing.ok || !(await listing.text()).includes(`/kiralama-yap/${vehicleId}?`)) throw new Error('Demo aracı müşteri arama sonuçlarında kiralanabilir değil')
    const response = await fetch('http://127.0.0.1:8091/kiralama-yap', { method: 'POST', redirect: 'manual', headers: { Cookie: cookie },
      body: new URLSearchParams({ aracId: String(vehicleId), alisTarihi: start, iadeTarihi: end, alisSaati: '10:00', iadeSaati: '10:00', odemeDurumu: 'OFISTE' }) })
    if (response.status !== 302 || !response.headers.get('location')?.includes('kiralamalarim?basarili')) throw new Error('Rezervasyon kaydedilemedi')
    return Number(mysql('SELECT MAX(id) FROM kiralamalar'))
  }
  async function delivered(id) {
    return waitFor('İmzalı teslimat', () => snapshot().events.find(e => Number(e.rental_id) === id && e.deliveries.some(d => d.status === 'succeeded')), 150)
  }
  const report = { at: new Date().toISOString(), scenarios: [] }
  const first = await reserve(); const firstEvent = await delivered(first)
  await waitFor('İlk e-posta', async () => (await mailCount()) === baseCount + 1)
  report.scenarios.push({ name: 'reservation_to_email', rental_id: first, event_id: firstEvent.id, passed: true })
  console.log('PASS: Rezervasyon → HookDesk → imzalı Python alıcısı → Mailpit')
  let receiverStopped = false, appStopped = false
  try {
    compose(['stop', 'receiver']); receiverStopped = true
    const second = await reserve()
    await waitFor('Başarısız teslimat', () => snapshot().events.find(e => Number(e.rental_id) === second && e.deliveries.some(d => d.status === 'retrying' && d.attempt_count >= 1)))
    compose(['up', '-d', '--no-deps', 'receiver']); receiverStopped = false
    const secondEvent = await delivered(second)
    await waitFor('İkinci e-posta', async () => (await mailCount()) === baseCount + 2)
    report.scenarios.push({ name: 'receiver_outage_recovery', rental_id: second, event_id: secondEvent.id, attempts: secondEvent.deliveries[0].attempt_count, passed: true })
    console.log('PASS: Alıcı kesintisi → yeniden deneme → e-posta')
    compose(['stop', 'app']); appStopped = true
    const third = await reserve()
    // Claim increments attempt_count before HTTP completes. Observe the failed
    // attempt and its durable retry state together, rather than racing PROCESSING.
    await waitFor('Kalıcı outbox', () => mysql(`SELECT COUNT(*) FROM hookdesk_outbox WHERE rental_id=${third} AND status='PENDING' AND attempt_count>=1 AND last_error IS NOT NULL AND hookdesk_event_id IS NULL`) === '1')
    compose(['up', '-d', '--no-deps', 'app']); appStopped = false
    await ready(); const thirdEvent = await delivered(third)
    await waitFor('Üçüncü e-posta', async () => (await mailCount()) === baseCount + 3)
    report.scenarios.push({ name: 'hookdesk_outage_outbox_recovery', rental_id: third, event_id: thirdEvent.id, passed: true })
    console.log('PASS: HookDesk kesintisi → veritabanında bekleyen olay → otomatik teslimat')
    const rows = mysql(`SELECT status FROM hookdesk_outbox WHERE rental_id IN (${first},${second},${third})`).split('\n')
    if (rows.length !== 3 || rows.some(v => v.trim() !== 'SENT')) throw new Error('Outbox kabul durumu yanlış')
    report.mail_count_delta = (await mailCount()) - baseCount
    writeFileSync(resolve(runtime, 'smoke-report.json'), JSON.stringify(report, null, 2) + '\n')
    console.log('3 uçtan uca senaryo geçti. Rapor: .runtime/hookdesk/smoke-report.json')
  } finally {
    if (appStopped) compose(['up', '-d', '--no-deps', 'app'])
    if (receiverStopped) compose(['up', '-d', '--no-deps', 'receiver'])
  }
}
try {
  if (action === 'setup') {
    if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
      const disk = statfsSync(process.env.LOCALAPPDATA)
      if (disk.bavail * disk.bsize < 2 * 1024 ** 3) throw new Error('Windows kullanıcı diski için en az 2 GiB boş alan gerekli; Docker imajları için ayrıca yeterli alan ayır.')
    }
    init(); compose(['build', 'app', 'gateway', 'rental', 'receiver'], true)
    compose(['up', '-d', 'postgres', 'redis', 'mysql', 'mailpit', 'app'], true)
    compose(['exec', '-T', 'app', 'php', 'artisan', 'migrate', '--force'], true)
    compose(['exec', '-T', 'app', 'php', 'rental-fixture.php', 'seed'])
    compose(['up', '-d'], true); await ready()
    console.log('Demo hazır. Giriş bilgileri: .runtime/hookdesk/giris-bilgileri.txt')
  } else {
    if (!existsSync(envFile)) throw new Error('Önce setup komutunu çalıştır')
    if (action === 'start') { compose(['up', '-d'], true); await ready() }
    if (action === 'stop') compose(['stop'], true)
    if (action === 'status') { compose(['ps'], true); console.log(JSON.stringify(snapshot(), null, 2)) }
    if (action === 'smoke') await smoke()
  }
} catch (error) {
  console.error(error.message); process.exitCode = 1
}
