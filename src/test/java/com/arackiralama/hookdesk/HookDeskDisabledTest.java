package com.arackiralama.hookdesk;

import com.arackiralama.dto.KiralamaIstegi;
import com.arackiralama.model.*;
import com.arackiralama.servis.*;
import com.arackiralama.veritabani.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class HookDeskDisabledTest {
    @Test
    void disabledIntegrationKeepsExistingReservationEmailFlow() {
        KiralamaRepository rentals = mock(KiralamaRepository.class);
        AracRepository vehicles = mock(AracRepository.class);
        KullaniciRepository users = mock(KullaniciRepository.class);
        MailServis mail = mock(MailServis.class);
        HookDeskOutbox outbox = mock(HookDeskOutbox.class);
        Arac vehicle = new Arac(); vehicle.setGunlukFiyat(new BigDecimal("100"));
        vehicle.setMarka("Demo"); vehicle.setModel("Vehicle");
        Kullanici user = new Kullanici("Demo", "demo@example.com", "unused", Rol.MUSTERI);
        when(vehicles.findById(1L)).thenReturn(Optional.of(vehicle));
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(rentals.tarihCakisiyorMu(any(), any(), any())).thenReturn(List.of());
        when(rentals.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        KiralamaIstegi request = new KiralamaIstegi(); request.setAracId(1L); request.setKullaniciId(1L);
        request.setAlisTarihi(LocalDate.of(2027, 1, 1)); request.setIadeTarihi(LocalDate.of(2027, 1, 2));
        new KiralamaServis(rentals, mail, vehicles, users, mock(BakimServis.class), outbox).kiralamaYap(request);
        verify(mail).mailGonder(eq("demo@example.com"), eq("Rezervasyon Onayı"), contains("Rezervasyonunuz"));
        verify(outbox, never()).enqueue(any());
    }
}
