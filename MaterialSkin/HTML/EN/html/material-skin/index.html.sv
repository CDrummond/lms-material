[% PROCESS materialhelpheader.html %]
<h1>Inledning</h1>
<p>MaterialSkin är en (förhoppningsvis) enkel HTML5-webbapp för Lyrion, med två huvudlayouter:
  <ul>
    <li>Mobil</li>
    <li>Desktop</li>
  </ul>
Appen försöker att välja den bästa layouten beroende på bredden på skärmen du använder. Du kan dock använda 'Inställningar -> Gränssnitt' för att åsidosätta detta och tvinga fram användningen av den ena eller den andra layouten.
</p>
<p>Den här hjälpsidan innehåller grundläggande information som förhoppningsvis hjälper till att förklara hur man använder appen.
</p>
<br/>

<h1>Mobil layout</h1>
<p>Denna layout är avsedd för användning på mobiltelefoner och små surfplattor. Som standard innehåller den en vy-väljare längst ner, vilket gör att den aktuella vyn kan växlas mellan:
  
  <ul>
    <li>Bläddra – låter dig bläddra i din lokala musiksamling, appar, radiostationer etc.</li>
    <li>Spelar – visar information (t.ex. titel, omslag etc.) om det spår som spelas just nu.</li>
    <li>Kö – visar listan över spår som för närvarande står i kö.</li>
  </ul>
Du kan navigera mellan vyer genom att antingen trycka på motsvarande knapp längst ner på skärmen eller genom att svepa åt vänster/höger.
Om du redan är i en vy och trycker på dess knapp kommer följande att hända:
  <ul>
    <li>Bläddra – navigera en nivå bakåt, d.v.s. detta är samma sak som att trycka på bakåtknappen. Långt tryck för att navigera till "Hem".</li>
    <li>Spelar – visar information om artist, album och låt om plugin-programmet 'Musik- och artistinformation' är installerat på ditt Lyrion-system. 
   Långt tryck visar dialogrutan 'Viloläge'. 
    <li>Kö - rulla uppspelningskön till det aktuella spåret.</li>
  </ul>
</p>
<br/>

<h1>Desktop layout</h1>
<p>Den här layouten är avsedd för system eller apparater med breda skärmar, som bärbara och stationära datorer. Den här layouten visar bläddringsvyn till vänster, kön till höger och detaljer om det aktuella spåret längst ner (om det finns spår i kön). Som standard är kön inte "fäst", så om du trycker på knappen "Visa kö" i huvudverktygsfältet skjuts kön in från höger. Om du vill att kön alltid ska visas till höger, använd menyknappen i kövyn och välj "Fäst". 
<br/><br/>
Om du trycker på knappen "Visa Nu spelas" i huvudverktygsfältet ersätts Bläddra- och Kövyerna med en enda vy som visar stora omslagsbilder och spårdetaljer. På liknande sätt visas en vy som innehåller information om artist, album och spår (t.ex. sångtext) om du klickar på "Visa information om det aktuella spåret".
</p>
<br/>

<h1>Långt tryck</h1>
<p>Det finns flera långt-tryck-funktioner i appen. Dessa gör det möjligt att komma åt funktioner genom att trycka på ett element i en halv sekund eller mer. De nuvarande långt-tryck-funktionerna är:

  <ul>
    <li>Bläddra längst ner i mobillayouten – om appen redan visar bläddringsvyn, navigerar ett långt tryck här tillbaka till 'Hem'.</li>
    <li>'Tillbaka'-knappen i blädder-vyn - gå till 'Hem'. Inte för iOS.</li>
    <li>'Tillbaka'-knappen i inställningsvyer (t.ex. 'Spelarinställningar') - stänger alla inställningsvyer. Inte för iOS.</li>
    <li>Volym-knappar - stäng av ljud / sätt på ljud.</li>
    <li>'Spela/pausa' knappar - 'Stoppa' uppspelningen, d.v.s. fungera som en stoppknapp.</li>
    <li>'Repetera av' symbol, eller DSTM (oändlighets) symbol - visa DSTM (Stoppa inte musiken) inställningar.</li>
    <li>Varaktighetsfält i kö-vyn - öppna 'Flytta kön'-dialogen, bara om du har 2 eller fler spelare.</li>
    <li>En spelares På- och Avknappen (i huvudmenyn) - Öppna 'Viloläges'-dialogen.</li>
    <li>Spelarsymbol (i huvudmenyn) - öppna 'Synkronisations'-dialogen, bara om du har 2 eller fler spelare.</li>
    <li>'Administrera spelare' menyn - öppna 'Synkronisations'-dialogen, bara om du har 2 eller fler spelare.</li>
    <li>'Föregående spår' knapp - hoppa X sekunder tillbaka, håll nertryckt för att hoppa flera gånger. Hur långt hoppet är, är inställbart.</li>
    <li>'Nästa spår' knapp - hoppa X sekunder framåt, håll nertryckt för att hoppa flera gånger. Hur långt hoppet är, är inställbart.</li>
    <li>Om du har speciella plugin-program inställningar som lagts till på 'Spelarinställningar", så kan de läggas till på hemsidan genom att du trycker länge på dem.</li>
    <li>'Bläddra' knappen i navigationsfältet underst på skärmen. Om du redan bläddrar tar ett långt tryck dig tillbaka till hemsidan.</li>
    <li>'Spelar' knappen i navigationsfältet underst på skärmen. Om 'Nu Spelar' redan visas öppnar ett långt tryck på den knappen dialogen för viloläge.</li>
    <li>'Töm kön' knappen - Tömmer hela kön utan bekräftelse.</li>
    <li>'Lyrion symbolen' i huvudmenyn, öppnar Lyrions websida.</li>
  </ul>
</p>
<br/>

<h1>Administrera spelare</h1>
<p>Om du har två eller fler spelare anslutna till din Lyrion-server, eller flera Lyrion-servrar, kommer det att finnas en "Administrera spelare"-post i menyn som visas när du trycker på en spelares namn i huvudverktygsfältet. Detta öppnar en inställningssida som låter dig se den aktuella statusen för alla dina spelare (nuvarande spår, volym osv.). Den sidan låter dig:
  <ul>
    <li>Lista standardspelare och Gruppspelare. Gruppspelare visas bara om du har installerat plugin-programmet 'Gruppspelare'.</li>
    <li>Synkronisera spelare. Genom att dra en spelare över en annan kan du skapa en grupp med synkroniserade spelare. För att ta bort en spelare från en grupp, dra spelaren till huvudverktygsfältet (som ska visa "Dra hit för att ta bort från gruppen"). Eller tryck på synkronisationssymbolen framför en synkroniserad spelare, då öppnas en dialog där synkronisationen kan avslutas.</li>
    <li>Om du har installerat plugin-programmet 'Gruppera spelare', då kan du skapa, redigera och ta bort sådan a grupper här.
Den här inställningssidan har en menyknapp uppe i högra hörnet. I den menyn finns en option att skapa spelargrupper.</li>
    <li>Om du har flera Lyrion-servrar på samma nätverk, då kan den här sidan användas för att flytta spelare från andra servrar till den här.</li>
    <li>Markera en spelare som standardspelare. Om en spelare är markerade som standardspelare, då väljs den automatiskt när Material Skin startas. Om standardspelaren inte är synlig på nätverket när Material skin startas, då används en annan spelare, men om standardspelaren dyker upp på nätverket väljs den då. För att markera en spelare som standard, använd menyknappen med de tre prickarna längst till höger efter varje spelare.</li>
  </ul>
Den för tillfället valda spelaren har en halvtransparent markering. Om en spelare är standardspelaren är den markered med en hake till höger om namnet. Om spelare har ett aktivt viloläge visas en bild av en liten säng till höger om namnet.
</p>
<br/>

<h1>Inställningar</h1>
<p>På grund av hur Lyrion Music server är uppbyggd finns det flera inställningssidor och inställningsdialoger.
  <ul>
    <li>Gränssnitt - innehåller inställningar för att styra layouten för Material Skin-gränssnittet. Alla ändringar här lagras i den aktuella webbläsaren och är därför användarspecifika. För att du ska kunna ställa in standardinställningar finns det längst ner på sidan två knappar 'Spara som standard' och 'Återställ till standard'. Det finns också Material Skin-inställningar i kategorin Serverinställningar - dessa inställningar kommer att delas för alla användare.</li>
    <li>Spelare - innehåller spelarspecifika inställningar, såsom namn, larm etc. Som standard visas endast ett begränsat antal inställningar, men Lyrion har många inställningar. För att komma åt alla Lyrion-inställningar för en spelare, tryck på knappen "Extra inställningar" längst ner på den här sidan. Om din spelare är en piCorePlayer- eller SqueezeESP32-enhet, kommer den här sidan också att innehålla en knapp som låter dig komma åt det webbaserade konfigurationsgränssnittet för dessa enheter.</li>
    <li>Server - innehåller alla Lyrion Music Server inställningar. Från här installeras även plugin-program. Plugin-programmens instaällningar finns även här.</li>
  </ul>
</p>
<br/>

<h1>Bläddringslägen</h1>
<p>Vanligtvis konfigureras listan över bläddringslägen (t.ex. artister, album, genrer) per spelare med Lyrion. Det är därför det i avsnittet "Extra inställningar" i "Spelarinställningar" finns ett avsnitt som heter "Ytterligare bläddringslägen". Men eftersom den här appen är utformad för att styra flera spelare konfigureras inte listan över bläddringslägen som är tillgängliga för den här appen där utan i "Inställningar -> Gränssnitt".
I den dialogrutan ser du en uppsättning kryssrutor för att konfigurera vilka toppnivåkategorier som visas på "Hem"-skärmen. Posten "Min
musik" har en kugghjulsikon bredvid sig. Om du trycker på den här ikonen visas en dialogruta som låter dig konfigurera vilka bläddringslägen som ska visas med den här appen.
</p>
<br/>

<h1>Delbibliotek</h1>
<p>Delbibliotek i Lyrion är ett sätt att skapa underbibliotek till din musiksamling. T.ex. kan du ha ett bibliotek för varje familjemedlem, så att de bara ser de artister etc. som de bryr sig om.
</p>
<p>Precis som med "Bläddringslägen" ställer Lyrion vanligtvis in det aktiva biblioteket per spelare. Och med den här appen kan du ställa in ett bibliotek för en spelare på "Spelarinställningar"-sidan. Om så är fallet skulle det biblioteket begränsa de spår som vissa Lyrion-funktioner (som "Slumpmässig mix") skulle använda. Den här appen skiljer sig dock återigen från standard Lyrion genom att tillåta att biblioteksvalet ställs in för den här instansen av appen, och det skulle vara detsamma oavsett vilken spelare du väljer. Så, till exempel, skulle en familjemedlem se sitt önskade bibliotek oavsett vilken spelare de för närvarande använder.
</p>
<p>Observera dock att dessa bibliotek, och valet av dem, inte kommer att synas förrän du faktiskt skapar ett sådant bibliotek. Det finns olika sätt att göra detta; genom att spara en "Avancerad sökning" (klicka på sökikonen på appens "Hem"-skärm och klicka sedan på ikonen "Avancerad sökning" som visas därefter), eller använd plugin-program som "Enkla biblioteksvyer".
</p>
</div>
[% PROCESS materialhelpfooter.html %]


