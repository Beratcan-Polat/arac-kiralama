<?php

// CLI-only fixture for the isolated demo. Never runs against the user's HookDesk DB.
use App\Models\Delivery;
use App\Models\Endpoint;
use App\Models\EndpointSubscription;
use App\Models\Event;
use App\Models\Membership;
use App\Models\Project;
use App\Models\ProjectApiKey;
use App\Models\SigningSecret;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (PHP_SAPI !== 'cli' || getenv('HOOKDESK_RENTAL_DEMO') !== 'true'
    || config('database.default') !== 'pgsql'
    || config('database.connections.pgsql.database') !== 'hookdesk_rental_demo') {
    throw new RuntimeException('This helper requires the isolated rental demo.');
}

$action = $argv[1] ?? '';
if ($action === 'seed') {
    $result = DB::transaction(function () {
        $user = User::firstOrCreate(['email' => 'gelistirici@rental.hookdesk.test'], [
            'name' => 'Entegrasyon demosu', 'password' => getenv('DEMO_DASHBOARD_PASSWORD'), 'locale' => 'tr',
        ]);
        if (!$user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
        $workspace = Workspace::firstOrCreate(['owner_user_id' => $user->id], ['name' => 'Araç Kiralama Demosu']);
        Membership::firstOrCreate(['workspace_id' => $workspace->id, 'user_id' => $user->id], ['role' => 'owner']);
        $project = Project::firstOrCreate(['workspace_id' => $workspace->id, 'name' => 'Rezervasyon bildirimleri']);
        $endpoint = Endpoint::firstOrCreate(['id' => getenv('HOOKDESK_DEMO_ENDPOINT_ID')], [
            'project_id' => $project->id, 'name' => 'Python rezervasyon alıcısı — yerel demo',
            'kind' => 'sandbox', 'sandbox_behavior' => 'success',
        ]);
        EndpointSubscription::firstOrCreate(['endpoint_id' => $endpoint->id, 'event_type' => 'rental.created']);
        SigningSecret::firstOrCreate(['endpoint_id' => $endpoint->id, 'version' => 1], ['secret' => getenv('HOOKDESK_SIGNING_SECRET')]);
        $token = getenv('HOOKDESK_API_KEY');
        ProjectApiKey::firstOrCreate(['token_hash' => hash('sha256', $token)], [
            'project_id' => $project->id, 'created_by' => $user->id, 'name' => 'Java demo publisher',
            'prefix' => substr($token, 0, 12), 'abilities' => ['events:write', 'events:read'], 'expires_at' => now()->addDays(90),
        ]);

        return ['workspace_id' => $workspace->id, 'project_id' => $project->id, 'endpoint_id' => $endpoint->id];
    });
    echo json_encode($result, JSON_THROW_ON_ERROR);
} elseif ($action === 'status') {
    $events = Event::where('type', 'rental.created')->orderBy('created_at')->get();
    echo json_encode(['events' => $events->map(fn ($event) => [
        'id' => $event->id, 'rental_id' => $event->data['rental_id'] ?? null,
        'routing_result' => $event->routing_result,
        'deliveries' => Delivery::where('event_id', $event->id)->with('attempts')->get()->map(fn ($d) => [
            'id' => $d->id, 'status' => $d->status, 'attempt_count' => $d->attempt_count,
            'attempts' => $d->attempts->map(fn ($a) => ['number' => $a->number, 'http_status' => $a->http_status, 'outcome' => $a->outcome]),
        ]),
    ])], JSON_THROW_ON_ERROR);
} else {
    throw new InvalidArgumentException('Unknown demo action.');
}
