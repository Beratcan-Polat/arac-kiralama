package com.arackiralama.guvenlik;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFiltre extends OncePerRequestFilter {

    private final JwtServis jwtServis;
    private final UserDetailsService kullaniciDetayServisi;

    public JwtFiltre(JwtServis jwtServis, UserDetailsService kullaniciDetayServisi) {
        this.jwtServis = jwtServis;
        this.kullaniciDetayServisi = kullaniciDetayServisi;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String kullaniciAdi;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("JWT Filter: Auth header eksik veya Bearer değil: " + authHeader);
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("JWT Filter: Token bulundu, işleniyor...");

        jwt = authHeader.substring(7);
        // Türkçe metod ismi kullanıyoruz
        kullaniciAdi = jwtServis.kullaniciAdiGetir(jwt);

        if (kullaniciAdi != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.kullaniciDetayServisi.loadUserByUsername(kullaniciAdi);

            // Türkçe metod ismi kullanıyoruz
            if (jwtServis.tokenDogrula(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
