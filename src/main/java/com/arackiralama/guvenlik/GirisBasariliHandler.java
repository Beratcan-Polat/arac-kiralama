package com.arackiralama.guvenlik;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

@Component
public class GirisBasariliHandler implements AuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        
        // Kullanıcının rollerini alıyoruz
        Set<String> roller = AuthorityUtils.authorityListToSet(authentication.getAuthorities());

        if (roller.contains("ROLE_ADMIN")) {
            response.sendRedirect("/admin/panel");
        } else if (roller.contains("ROLE_PERSONEL")) {
            response.sendRedirect("/personel/panel");
        } else {
            // Varsayılan olarak Müşteri kabul ediyoruz
            response.sendRedirect("/araclar");
        }
    }
}