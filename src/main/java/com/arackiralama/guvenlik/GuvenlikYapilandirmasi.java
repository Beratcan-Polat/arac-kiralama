package com.arackiralama.guvenlik;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class GuvenlikYapilandirmasi {

    private final GirisBasariliHandler girisBasariliHandler;
    private final JwtFiltre jwtFiltre;

    public GuvenlikYapilandirmasi(GirisBasariliHandler girisBasariliHandler, JwtFiltre jwtFiltre) {
        this.girisBasariliHandler = girisBasariliHandler;
        this.jwtFiltre = jwtFiltre;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        // Statik dosyalar ve giriş sayfaları
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/giris", "/kayit").permitAll()

                        // API Auth endpointleri serbest (Mobil giriş için)
                        .requestMatchers("/api/auth/**").permitAll()

                        // ROL KISITLAMALARI
                        .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/personel/**", "/api/personel/**").hasAnyRole("PERSONEL", "ADMIN")
                        .requestMatchers("/arac-ekle").hasAnyRole("PERSONEL", "ADMIN")
                        .requestMatchers("/arac-duzenle/**").hasAnyRole("PERSONEL", "ADMIN")

                        // API için genel koruma (diğer endpoints)
                        .requestMatchers("/api/**").authenticated()

                        // Kalan her yer authenticated
                        .anyRequest().authenticated())
                // WEB TARAFI İÇİN FORM LOGIN (Klasik)
                .formLogin(form -> form
                        .loginPage("/giris")
                        .loginProcessingUrl("/giris")
                        .successHandler(girisBasariliHandler)
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/cikis")
                        .logoutSuccessUrl("/giris?cikis")
                        .permitAll())
                // API TARAFI İÇİN STATELESS SESSION VE JWT FILTER
                // Not: Web tarafında cookie/session çalışması bozulabilir mi?
                // Hem MVC hem API aynı anda çalışıyorsa Session policy'i tamamen Stateless
                // yapmamalıyız.
                // Fakat JWT genellikle stateless ister.
                // Hibrit çözüm: Filtreyi ekliyoruz ama SessionPolicy'i global kapatmıyoruz.
                // Web kullanıcıları session kullanır, API kullanıcıları token gönderir.
                .addFilterBefore(jwtFiltre, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}