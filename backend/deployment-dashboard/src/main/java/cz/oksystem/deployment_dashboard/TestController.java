package cz.oksystem.deployment_dashboard;

import jakarta.annotation.Nullable;
import org.springframework.web.bind.annotation.*;

@RestController
public class TestController {

  @GetMapping("api/getme/{id}")
  String getMe(@PathVariable("id") long id,
               @RequestParam("param1") String param1,
               @RequestParam(value = "param2", required = false) String param2) {
    System.out.println(id);
    System.out.println(param1);
    System.out.println(param2);
    return "It works!";
  }

  @PostMapping("api/postme")
  void postMe(@RequestBody TestDto testDto){
    System.out.println(testDto.testName);
  }

  public static class TestDto {
    String testName;

    public String getTestName() {
      return testName;
    }

    public void setTestName(String testName) {
      this.testName = testName;
    }
  }
}
