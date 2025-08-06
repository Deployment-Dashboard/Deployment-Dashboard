Tento repozitář slouží k vyzkoušení implementovaných GitHub Actions v rámci bakalářské práce <b>Continuous Integration/Continuous Delivery a webová aplikace pro evidenci nasazených verzí napříč různými prostředími</b>.

<h2>Prerekvizity pro operační systém Windows 10/11:</h2>
<ol>
  <li>Připojení k internetu</li>
  <li>Nainstalovaný <a href="https://git-scm.com/downloads/win">git</a></li>
  <li>Naklonovaný repozitář – ve Windows Powershell příkazem:<br/><code>git clone "https://github.com/Deployment-Dashboard/Deployment-Dashboard.git"</code></li>
</ol>

<h2>Continuous Integration</h2>

<p>Pipeline CI se spouští po vytvoření pull requestu, pro otestování tedy musíme:</p>
<ol>
  <li>Vytvořit lokálně novou větev:</li>
    <ol>
      <li>
        <p>
          Ve Windows Powershell přejdeme do naklonovaného repozitáře:
        </p>
        <code>cd .\path\to\repo</code>
      </li>
      <li>
        <p>
          Vytvoříme větev:
        </p>
        <code>git checkout -b "branch-name"</code>
      </li>
      <li>
        <p>
          Provedeme změny v kódu (např. přidáme komentář – <code>//</code>) do souboru:
          <code>Deployment-Dashboard\backend\deployment-dashboard\src\main\java\cz\oksystem\deployment_dashboard\dto\EnvironmentDto.java</code> na řádek <code>4</code>:<br/>
        </p>
        <p>před:</p>
        <img width="452" height="115" alt="image" src="https://github.com/user-attachments/assets/4f628da6-199e-4fb6-a28e-2c4b3a5a2f44" />
        <p>po:</p>
        <img width="509" height="114" alt="image" src="https://github.com/user-attachments/assets/46bed729-9c1d-4428-85e1-275b197a278d" />
      </li>
      <li>
        <p>
          Změny a větev odešleme do vzdáleného repozitáře:
        </p>
        <code>git add .</code><br/>
        <code>git commit -m "Testovací commit"</code><br/>
        <code>git push -u origin "branch-name"</code>
      </li>
      <li>
        <p>
          Otevřeme webový prohlížec a přejdeme na adresu:
        </p>
        https://github.com/Deployment-Dashboard/Deployment-Dashboard/tree/master
      </li>
      <li>
        <p>
          Přejdeme na záložku "Pull requests":
        </p>
        <img width="475" height="106" alt="image" src="https://github.com/user-attachments/assets/6bdf3fe7-d9c0-4ff6-8e4a-89ba094df100" />
      </li>
      <li>
        <p>
          Klikneme na zelené tlačítko "New pull request":
        </p>
        <img width="1230" height="382" alt="image" src="https://github.com/user-attachments/assets/e4c42445-d6b7-4347-9b16-686fd4a3b3bb" />
      </li>
      <li>
        <p>
          Zvolíme námi vytvořenou větev:
        </p>
        <img width="747" height="407" alt="image" src="https://github.com/user-attachments/assets/df8066e6-4a30-42da-8cde-1a74ba5b9e43" />
      </li>
      <li>
        <p>
          Stiskneme zelené tlačítko "Create pull request":
        </p>
        <img width="1234" height="282" alt="image" src="https://github.com/user-attachments/assets/653ed3ac-ddcd-4dbf-9365-6e21a9c7399b" />
        <p>následně i zde:</p>
        <img width="1248" height="714" alt="image" src="https://github.com/user-attachments/assets/02f0c7c6-f983-493b-8b6d-e7f8bbd829e4" />
      </li>
      <li>
        <p>
          Nyní se ocitneme na stránce vytvořeného pull requestu, kde by se po pár vteřinách měla objevit následující sekce:
        </p>
        <img width="925" height="776" alt="image" src="https://github.com/user-attachments/assets/c4920d1c-a9dc-4b2f-a93c-a613f3cdb00d" />
        <p>Žlutě jsou označeny právě probíhající kontroly.</p>
        <img width="919" height="779" alt="image" src="https://github.com/user-attachments/assets/3d99da9f-7b46-4778-9a61-af79aaa1aff2" />
        <p>Po úspěsném proběhnutí testů se barva změní na zelenou.</p>
        <img width="916" height="881" alt="image" src="https://github.com/user-attachments/assets/3aa4e4b2-03dd-45e2-a00f-39c51eaf4b19" />
        <p>Červená barva značí, že některá z kontrol selhala a integrace změn není povolena. V takovém případě můžeme kontrolu rozkliknout:</p>
        <img width="849" height="138" alt="image" src="https://github.com/user-attachments/assets/787076f2-4ad3-4ea0-bc58-5eb1418749d2" />
        <p>Zobrazí se podrobný výpis z průběhu kontroly, který nám může pomoct zjistit, kde nastal problém:</p>
        <img width="1350" height="1222" alt="image" src="https://github.com/user-attachments/assets/b3138199-153c-45ed-80c1-dbb39f443a30" />
        <p>V tomto případě selhal test <code>ApiControllerIntegrationTests > addEmptyJsonFails()</code>.</p>
        <p>Pipeline se automaticky znova spustí po každém novém commitu do větve.</p>
      </li>
    </ol>
    <h2>Continuous Delivery</h2>
    <p>Pipeline Release se spouští po vytvoření tzv. tagu. Tagy slouží k označení významých commitů, jako jsou například nové verze.</p>
    <p>Abychom pipile spustili, musíme provést následující kroky:</p>
    <ol>
      <li>
        <p>
          Ve Windows Powershell přejdeme do naklonovaného repozitáře:
        </p>
        <code>cd .\path\to\repo</code>
      </li>
      <li>
        <p>
          Ujistíme se, že jsme na hlavní větvi:
        </p>
        <code>git checkout "master"</code>
      </li>
      <li>
        <p>
          Vytvoříme nový tag:
        </p>
        <ul>
          <li>
            <p>pro backend:</p>
            <code>git tag "release/be/x.y.z"</code>
          </li>
          <li>
            <p>pro frontend:</p>
            <code>git tag "release/fe/x.y.z"</code>
          </li>
        </ul>
      </li>
      <li>
        <p>
          Publikujeme tag do vzdáleného repozitáře:
        </p>
        <code>git push origin "release/be/x.y.z"</code>
        <p>případně:</p>
        <code>git push origin "release/fe/x.y.z"</code>
      </li>
    </ol>
