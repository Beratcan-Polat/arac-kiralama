package com.arackiralama.kontrol;

import com.arackiralama.dto.KayitIstegi;
import com.arackiralama.servis.AuthServis;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class WebGirisKontrol {

    private final AuthServis authServis;

    // AuthServis'i buraya bağlıyoruz ki kayıt işlemini yapabilelim
    public WebGirisKontrol(AuthServis authServis) {
        this.authServis = authServis;
    }

    @GetMapping("/giris")
    public String girisSayfasi() {
        return "giris";
    }

    @GetMapping("/kayit")
    public String kayitSayfasi() {
        return "kayit";
    }

    // KAYIT FORMU GÖNDERİLİNCE BURASI ÇALIŞIR
    @PostMapping("/kayit")
    public String kayitOl(@ModelAttribute KayitIstegi istek, Model model) {
        try {
            authServis.kayitOl(istek);
            // Başarılı olursa giriş sayfasına yönlendir ve mesaj göster
            return "redirect:/giris?basarili";
        } catch (Exception e) {
            // Hata olursa (örn: Email zaten kayıtlı) tekrar kayıt sayfasını aç ve hatayı
            // göster
            model.addAttribute("hata", e.getMessage());
            return "kayit";
        }
    }

    @GetMapping("/")
    public String anaSayfa() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            String role = auth.getAuthorities().stream().findFirst().get().getAuthority();
            if (role.equals("ROLE_ADMIN")) {
                return "redirect:/admin/panel";
            } else if (role.equals("ROLE_PERSONEL")) {
                return "redirect:/personel/panel";
            } else {
                return "redirect:/araclar";
            }
        }
        return "redirect:/giris";
    }
}