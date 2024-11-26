package cz.oksystem.deployment_dashboard.serializers;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
@ConfigurationProperties(prefix = "spring.application")
public class CustomProtocolsSerializer extends JsonSerializer<Optional<String>> {
  private Map<String, String> customProtocols;


  public Map<String, String> getCustomProtocols() {
    return customProtocols;
  }

  public void setCustomProtocols(Map<String, String> customProtocols) {
    this.customProtocols = customProtocols;
  }

  @Override
  public void serialize(Optional<String> s, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
    if (s.isPresent()) {
      String str = s.get();

      int protocolEndIndex = str.indexOf("://");

      if (protocolEndIndex != -1) {
        String protocolName = str.substring(0, str.indexOf("://"));
        String replacement = customProtocols.get(protocolName);

        str = str.replace(protocolName + "://", replacement);
      }
      jsonGenerator.writeString(str);
    }
  }
}
