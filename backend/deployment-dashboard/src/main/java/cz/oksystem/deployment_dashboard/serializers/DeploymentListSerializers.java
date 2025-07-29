package cz.oksystem.deployment_dashboard.serializers;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.BeanSerializer;
import com.fasterxml.jackson.databind.ser.BeanSerializerFactory;
import cz.oksystem.deployment_dashboard.entity.Deployment;

import java.io.IOException;
import java.util.List;

public class DeploymentListSerializers {

  public static class VersionFieldSerializer extends JsonSerializer<List<Deployment>> {

    @Override
    public void serialize(List<Deployment> deployments, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
      jsonGenerator.writeStartArray();

      JavaType javaType = serializerProvider.constructType(Deployment.class);
      BeanSerializerFactory factory = BeanSerializerFactory.instance;
      BeanSerializer beanSerializer = (BeanSerializer) factory.findBeanOrAddOnSerializer(serializerProvider, javaType, null, false);


      for (Deployment deployment : deployments) {
        beanSerializer.serialize(deployment, jsonGenerator, serializerProvider);
      }
      jsonGenerator.writeEndArray();
    }
  }

  public static class EnvironmentFieldSerializer extends JsonSerializer<List<Deployment>> {
    @Override
    public void serialize(List<Deployment> deployments, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
      jsonGenerator.writeStartArray();

      for (Deployment deployment : deployments) {
        jsonGenerator.writeStartObject();
        if (deployment.getDate().isPresent()) {
          jsonGenerator.writeObjectField("date", deployment.getDate().get());
        }
        jsonGenerator.writeStringField("version", deployment.getVersion().getName());

        if (deployment.getJiraUrl().isPresent()) {
          serializerProvider.defaultSerializeField("jiraUrl", deployment.getJiraUrl(), jsonGenerator);
        }

        jsonGenerator.writeEndObject();
      }
      jsonGenerator.writeEndArray();
    }
  }
}
