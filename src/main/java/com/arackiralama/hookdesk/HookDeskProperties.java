package com.arackiralama.hookdesk;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "hookdesk")
public class HookDeskProperties {
    private boolean enabled;
    private boolean schedulingEnabled = true;
    private String baseUrl = "";
    private String apiKey = "";

    @PostConstruct
    void validate() {
        if (!enabled) return;
        URI uri;
        try { uri = URI.create(baseUrl); }
        catch (IllegalArgumentException e) { throw new IllegalStateException("Invalid hookdesk.base-url"); }
        if ((!"https".equals(uri.getScheme()) && !"http".equals(uri.getScheme()))
                || uri.getHost() == null || uri.getUserInfo() != null
                || uri.getRawQuery() != null || uri.getFragment() != null
                || !(uri.getPath().isEmpty() || uri.getPath().equals("/"))) {
            throw new IllegalStateException("hookdesk.base-url must be an HTTP(S) origin without credentials");
        }
        if (apiKey.isBlank() || apiKey.contains("\r") || apiKey.contains("\n")) {
            throw new IllegalStateException("hookdesk.api-key is required when HookDesk is enabled");
        }
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isSchedulingEnabled() { return schedulingEnabled; }
    public void setSchedulingEnabled(boolean schedulingEnabled) { this.schedulingEnabled = schedulingEnabled; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
}
