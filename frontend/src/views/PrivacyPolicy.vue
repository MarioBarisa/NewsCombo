<template>
  <main :lang="lang" class="min-h-screen bg-base-100 text-base-content">
    <div class="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div class="flex justify-end mb-8">
        <div class="join" role="group" :aria-label="lang === 'hr' ? 'Jezik dokumenta' : 'Document language'">
          <button type="button" class="join-item btn btn-sm" :class="lang === 'hr' ? 'btn-primary' : 'btn-ghost'" :aria-pressed="lang === 'hr'" @click="lang = 'hr'">HR</button>
          <button type="button" class="join-item btn btn-sm" :class="lang === 'en' ? 'btn-primary' : 'btn-ghost'" :aria-pressed="lang === 'en'" @click="lang = 'en'">EN</button>
        </div>
      </div>
      <router-link to="/" class="flex items-center justify-center gap-3 mb-6" :aria-label="lang === 'hr' ? 'NewsCombo početna' : 'NewsCombo home'"><svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#F74420]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg><span class="text-2xl font-bold">NewsCombo</span></router-link>
      <h1 class="text-3xl sm:text-4xl font-black text-center mb-2">{{ lang === 'hr' ? 'Pravila privatnosti' : 'Privacy Policy' }} – NewsCombo</h1>
      <p class="text-center text-base-content/50 text-sm mb-8">{{ lang === 'hr' ? 'Zadnja izmjena: 10. studenoga 2026.' : 'Last updated: November 10, 2026' }}</p>
      <div class="card bg-base-200 shadow-xl m-0!">
        <div class="card-body p-6! sm:p-8! space-y-6 text-base sm:text-lg leading-relaxed">
          <template v-if="lang === 'hr'">
<p>NewsCombo vjeruje u privatnost. Tvoji podaci su tvoji — ovdje je transparentno objašnjeno što prikupljamo i, još važnije, što ne radimo s tim.</p>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">1. Voditelj obrade podataka</h2>
              <p>NewsCombo je osobni projekt kojeg vodi Mario Bariša, bez registrirane tvrtke. Za sva pitanja vezana za privatnost i tvoje podatke, javi se na <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">2. Koje podatke prikupljamo</h2>
<ul class="list-disc list-inside space-y-2"><li>E-mail, ime, hash lozinke i identifikator računa za registraciju i prijavu.</li><li>RSS izvori, grupe, spremljeni članci, postavke i profil interesa za rad i sinkronizaciju aplikacije.</li><li>Profilna slika ako je samostalno preneseš.</li><li>Datum prihvaćanja i verzija Uvjeta korištenja i Pravila privatnosti.</li></ul><p>Personalizacija se računa u pregledniku. Profil interesa uključuje brojčane težine izvora, tema i kategorija te oznake reakcija potrebne za sinkronizaciju. Ne vodimo zasebnu povijest svih otvorenih članaka.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">3. Zašto prikupljamo te podatke</h2>
              <p>Isključivo radi pružanja Usluge koju si zatražio/la otvaranjem računa — odnosno radi izvršenja ugovora s tobom (čl. 6(1)(b) GDPR-a).</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">4. Gdje se podaci pohranjuju</h2>
<p>Podaci računa i aplikacije pohranjuju se u NewsCombo poslužiteljskoj bazi MongoDB. Lozinke se pohranjuju kao bcrypt hash, a ne kao čitljiv tekst.</p><p>RSS izvore i izvorne članke dohvaća naš poslužitelj. Pri izravnom učitavanju vanjskih slika ili otvaranju izvornih poveznica njihov pružatelj prima tehničke podatke zahtjeva, primjerice IP adresu. Prenesena profilna slika šalje se ImgBB-u.</p><p>Kada zatražiš AI sažetak, sadržaj odabranih RSS feedova šalje se Google Gemini servisu radi generiranja sažetka. Lozinka i profil interesa ne šalju se radi generiranja sažetka. Na te vanjske usluge primjenjuju se i njihova pravila privatnosti.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">5. Što nikad ne radimo s tvojim podacima</h2>
<ul class="list-disc list-inside space-y-2"><li>Ne prodajemo tvoje podatke.</li><li>Ne dijelimo ih za marketing; vanjski servisi obrađuju zahtjeve potrebne za funkcije koje odabereš.</li><li>Ne koristimo podatke računa i profil interesa za treniranje AI modela.</li></ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">6. Kolačići i lokalna pohrana</h2>
<p>Lokalna pohrana preglednika čuva sesiju za prijavu, postavke prikaza, predmemoriju vijesti i lokalnu kopiju profila interesa. To omogućuje rad aplikacije i brže učitavanje. Odjavom i brisanjem podataka web-mjesta možeš ukloniti lokalno pohranjene podatke; brisanje računa zasebna je radnja.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">7. Koliko dugo čuvamo podatke</h2>
<p>Podatke čuvamo dok imaš račun ili dok su potrebni za pružanje usluge. Račun možeš obrisati u aplikaciji; time se uklanjaju podaci računa, izvori, grupe, spremljeni članci i profil interesa iz aktivne baze. Sigurnosne kopije i zapisi pružatelja infrastrukture mogu imati zasebne rokove zadržavanja. Za upite o zadržavanju javi se na <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">8. Tvoja prava</h2>
              <p>Sukladno GDPR-u, imaš pravo:</p>
              <ul class="list-disc list-inside">
                <li>pristupiti svojim podacima,</li>
                <li>ispraviti netočne podatke,</li>
                <li>zatražiti brisanje podataka ("pravo na zaborav") – također dostupno samostalno, unutar aplikacije,</li>
                <li>ograničiti obradu ili uložiti prigovor na nju,</li>
                <li>zatražiti prijenosivost podataka,</li>
                <li>podnijeti prigovor Agenciji za zaštitu osobnih podataka (AZOP) ili nadležnom nadzornom tijelu u tvojoj zemlji.</li>
              </ul>
              <p>Za ostvarivanje ovih prava, javi se na <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">9. Djeca</h2>
              <p>NewsCombo nije posebno namijenjen djeci i ne prikuplja svjesno podatke djece mlađe od 16 godina bez pristanka roditelja. Ako smatraš da je dijete koristilo Uslugu bez odgovarajućeg pristanka, javi se i podaci će biti uklonjeni.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">10. Sigurnost</h2>
<p>Lozinke su zaštićene bcrypt hashiranjem, a pristup podacima računa zahtijeva autentifikaciju. Nijedan online sustav nije potpuno siguran. Ako uočiš sigurnosni problem, javi se na <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">11. Izmjene ovih Pravila</h2>
              <p>Ova Pravila mogu se povremeno ažurirati. Datum na vrhu dokumenta uvijek odražava posljednju izmjenu. Za veće promjene, trudit ću se obavijestiti korisnike unaprijed (npr. putem e-maila ili obavijesti u aplikaciji).</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">12. Kontakt</h2>
              <p>Mario Bariša – <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
            </div>
          </template>
          <template v-else>
<p>NewsCombo believes in privacy. Your data is yours — here's a transparent breakdown of what we collect, and more importantly, what we don't do with it.</p>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">1. Data controller</h2>
              <p>NewsCombo is a personal project run by Mario Bariša, with no registered company behind it. For any questions about privacy or your data, reach out at <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">2. What data we collect</h2>
              <ul class="list-disc list-inside space-y-2"><li>Email, name, password hash and account identifier for registration and login.</li><li>RSS sources, groups, saved articles, settings and an interest profile to operate and synchronise the application.</li><li>A profile picture if you choose to upload one.</li><li>The acceptance date and version of the Terms of Service and Privacy Policy.</li></ul><p>Personalisation is calculated in your browser. The interest profile includes numerical weights for sources, topics and categories, plus reaction markers needed for synchronisation. We do not maintain a separate history of all opened articles.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">3. Why we collect this data</h2>
              <p>Solely to provide the Service you requested by creating an account — i.e., to perform our contract with you (GDPR Art. 6(1)(b)).</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">4. Where data is stored</h2>
              <p>Account and application data is stored in NewsCombo’s server-side MongoDB database. Passwords are stored as bcrypt hashes, not readable text.</p><p>Our server retrieves RSS sources and original articles. When external images load directly or you open original links, their providers receive technical request data, such as your IP address. Profile pictures you upload are sent to ImgBB.</p><p>When you request an AI summary, content from your selected RSS feeds is sent to Google Gemini to generate it. Your password and interest profile are not sent for summary generation. These external services are also governed by their own privacy policies.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">5. What we never do with your data</h2>
              <ul class="list-disc list-inside space-y-2"><li>We do not sell your data.</li><li>We do not share it for marketing; external services process requests necessary for features you choose.</li><li>We do not use account data or interest profiles to train AI models.</li></ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">6. Cookies and local storage</h2>
              <p>Browser local storage holds your login session, display settings, a news cache and a local copy of your interest profile. This enables the application to work and load faster. Logging out and clearing site data lets you remove locally stored data; deleting your account is a separate action.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">7. How long we keep your data</h2>
              <p>We retain data while you have an account or while it is needed to provide the Service. You can delete your account in the application; this removes account data, sources, groups, saved articles and the interest profile from the active database. Infrastructure providers’ backups and logs may have separate retention periods. For retention enquiries, contact <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">8. Your rights</h2>
              <p>Under GDPR, you have the right to:</p>
              <ul class="list-disc list-inside">
                <li>access your data,</li>
                <li>correct inaccurate data,</li>
                <li>request deletion ("right to be forgotten") – also available directly within the app,</li>
                <li>restrict or object to processing,</li>
                <li>request data portability,</li>
                <li>lodge a complaint with your local data protection authority (in Croatia: AZOP), or the relevant authority in your country.</li>
              </ul>
              <p>To exercise these rights, contact <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">9. Children</h2>
              <p>NewsCombo isn't specifically directed at children and doesn't knowingly collect data from children under 16 without parental consent. If you believe a child has used the Service without appropriate consent, please get in touch and the data will be removed.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">10. Security</h2>
              <p>Passwords are protected with bcrypt hashing, and accessing account data requires authentication. No online system is completely secure. If you notice a security issue, contact <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">11. Changes to this policy</h2>
              <p>This policy may be updated from time to time. The date at the top always reflects the latest revision. I'll try to give advance notice of any major changes (e.g. via email or an in-app notice).</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">12. Contact</h2>
              <p>Mario Bariša – <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { useLegalLanguage } from '../composables/useLegalLanguage';

const lang = useLegalLanguage();
</script>
