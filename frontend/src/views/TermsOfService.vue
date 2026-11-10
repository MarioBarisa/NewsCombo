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
      <h1 class="text-3xl sm:text-4xl font-black text-center mb-2">{{ lang === 'hr' ? 'Uvjeti korištenja' : 'Terms of Service' }} – NewsCombo</h1>
      <p class="text-center text-base-content/50 text-sm mb-8">{{ lang === 'hr' ? 'Zadnja izmjena: 10. studenoga 2026.' : 'Last updated: November 10, 2026' }}</p>
      <div class="card bg-base-200 shadow-xl m-0!">
        <div class="card-body p-6! sm:p-8! space-y-6 text-base sm:text-lg leading-relaxed">
          <template v-if="lang === 'hr'">
<div class="space-y-2">
              <h2 class="text-xl font-bold">1. Tko stoji iza NewsComboa</h2>
              <p>NewsCombo razvija Mario Bariša, kao osobni projekt koji nastaje u slobodno vrijeme, iz interesa za vijesti i otvoreni web — ne kao registrirana tvrtka ili obrt. Trudim se da sve radi kako treba, ali sam jedna osoba, a ne firma s timom za podršku 😊</p>
              <p>Kontakt: <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">2. Prihvaćanje uvjeta</h2>
              <p>Korištenjem web aplikacije NewsCombo ("Usluga") prihvaćaš ove Uvjete korištenja i <a href="/privacy" target="_blank" rel="noopener noreferrer" class="link link-primary">Pravila privatnosti</a>. Ako se ne slažeš s njima, nemoj koristiti Uslugu.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">3. Opis usluge</h2>
<p>NewsCombo je alat za praćenje vijesti putem RSS feedova: grupe izvora, kronološki i personalizirani feed, spremljeni članci i AI sažeci. Namijenjen je osobnoj, nekomercijalnoj upotrebi. Sadržaj pripada izvornim izdavačima; NewsCombo ne jamči njegovu točnost ni dostupnost. AI sažeci mogu sadržavati pogreške — provjeri izvorni članak.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">4. Korisnički računi</h2>
              <ul class="list-disc list-inside">
                <li>Registracija i prijava odvijaju se putem e-mail adrese i lozinke, putem NewsCombo sustava za autentifikaciju.</li>
                <li>Odgovoran/na si za točnost podataka koje uneseš i za čuvanje lozinke u tajnosti.</li>
                <li>Aplikacija nudi mogućnost <strong>trajnog brisanja računa unutar same aplikacije</strong> — brisanjem se trajno uklanjaju svi povezani podaci.</li>
                <li>Usluga je namijenjena općoj publici. Ako si mlađi/a od 16 godina, provjeri imaš li dopuštenje roditelja ili staratelja prije korištenja, sukladno propisima o zaštiti podataka.</li>
              </ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">5. Usluga se pruža "takva kakva je"</h2>
              <p>Aplikacija se pruža u trenutnom stanju, bez ikakvih jamstava da će biti dostupna, bez grešaka ili prilagođena svrsi koju imaš na umu. Ne preuzimam odgovornost za štetu, gubitak podataka ili probleme nastale korištenjem NewsComboa, osim u mjeri u kojoj se odgovornost ne može zakonski isključiti (npr. namjera, gruba nepažnja, ili prava koja imaš kao potrošač sukladno važećim propisima o zaštiti potrošača). Koristiš Uslugu na vlastitu odgovornost.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">6. Dostupnost i izmjene usluge</h2>
              <p>NewsCombo može biti izmijenjen, privremeno ugašen ili trajno uklonjen bez prethodne najave. Trudit ću se unaprijed najaviti veće promjene (putem aplikacije ili e-maila), ali ne jamčim da će uvijek biti vremena za to.</p>
            </div>

            

            <div class="space-y-2">
              <h2 class="text-xl font-bold">7. Prihvatljivo korištenje</h2>
              <p>Slažeš se da nećeš:</p>
              <ul class="list-disc list-inside">
                <li>koristiti Uslugu za nezakonite ili zlonamjerne svrhe,</li>
                <li>pokušavati neovlašteno pristupiti sustavu ili podacima drugih korisnika,</li>
                <li>zaobilaziti sigurnosne mjere ili ometati rad aplikacije.</li>
              </ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">8. Intelektualno vlasništvo</h2>
<p>Izvorni kod NewsComboa javno je dostupan na GitHubu; korištenje koda uređuju uvjeti navedeni u repozitoriju. Naziv i dizajn pripadaju autoru, a članci i slike svojim izvornim nositeljima prava. Tvoji popisi izvora i ostali korisnički sadržaj ostaju tvoji; aplikaciji daješ ograničenu dozvolu njihove pohrane i prikaza radi pružanja usluge.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">9. Prekid pristupa</h2>
              <p>Pristup Usluzi mogu ograničiti ili ukinuti u slučaju kršenja ovih Uvjeta, uz prethodno upozorenje gdje je to razumno moguće.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">10. Tvoji podaci</h2>
<p>Podaci služe radu i sinkronizaciji aplikacije, a personalizacija feeda računa se u tvojem pregledniku. Ne prodajemo podatke. Pojedinosti su u <router-link to="/privacy" class="link link-primary">Pravilima privatnosti</router-link>.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">11. Mjerodavno pravo</h2>
              <p>Na ove Uvjete primjenjuje se hrvatsko pravo, uz zadržavanje obvezujućih prava koja imaš kao potrošač prema propisima Europske unije, ako se primjenjuju na tebe.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">12. Izmjene ovih Uvjeta</h2>
              <p>Ove Uvjete mogu povremeno ažurirati. Datum na vrhu dokumenta uvijek odražava posljednju izmjenu. Za veće promjene, trudit ću se obavijestiti korisnike unaprijed.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">13. Kontakt</h2>
              <p>Pitanje ili nedoumica? Slobodno se javi — tu sam da pomognem 🙌 <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
            </div>
          </template>
          <template v-else>
<div class="space-y-2">
              <h2 class="text-xl font-bold">1. Who's behind NewsCombo</h2>
              <p>NewsCombo is developed by Mario Bariša as a personal, free-time project born out of an interest in news and the open web — not as a registered company. I do my best to keep things running smoothly, but I'm one person, not a support team 😊</p>
              <p>Contact: <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">2. Acceptance of terms</h2>
              <p>By using the NewsCombo web app (the "Service"), you accept these Terms of Service and the <a href="/privacy" target="_blank" rel="noopener noreferrer" class="link link-primary">Privacy Policy</a>. If you don't agree, please don't use the Service.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">3. Description of the service</h2>
              <p>NewsCombo is an RSS news reader with source groups, chronological and personalised feeds, saved articles and AI summaries. It is intended for personal, non-commercial use. Content belongs to its original publishers; NewsCombo does not guarantee its accuracy or availability. AI summaries may contain errors — check the original article.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">4. User accounts</h2>
              <ul class="list-disc list-inside">
                <li>Sign-up and login happen via email and password, through NewsCombo’s authentication system.</li>
                <li>You're responsible for the accuracy of the information you provide and for keeping your password confidential.</li>
                <li>The app offers <strong>permanent in-app account deletion</strong> — deleting your account permanently removes all associated data.</li>
                <li>The Service is intended for a general audience. If you're under 16, please make sure you have permission from a parent or guardian before using it, in line with applicable data protection rules.</li>
              </ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">5. The service is provided "as is"</h2>
              <p>The app is provided as-is, without warranties of any kind regarding availability, error-free operation, or fitness for a particular purpose. I'm not liable for damages, data loss, or issues arising from using NewsCombo, except where liability cannot be legally excluded (e.g. intent, gross negligence, or statutory consumer rights that apply to you). You use the Service at your own risk.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">6. Availability and changes</h2>
              <p>NewsCombo may be modified, temporarily suspended, or permanently discontinued without prior notice. I'll try to give advance notice of major changes (via the app or email), but I can't guarantee there will always be time to do so.</p>
            </div>

            

            <div class="space-y-2">
              <h2 class="text-xl font-bold">7. Acceptable use</h2>
              <p>You agree not to:</p>
              <ul class="list-disc list-inside">
                <li>use the Service for unlawful or malicious purposes,</li>
                <li>attempt unauthorized access to the system or other users' data,</li>
                <li>bypass security measures or disrupt the application.</li>
              </ul>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">8. Intellectual property</h2>
              <p>NewsCombo’s source code is publicly available on GitHub; use of the code is governed by the terms stated in the repository. The name and design belong to the author, while articles and images belong to their respective rights holders. Your source lists and other user content remain yours; you grant the application a limited licence to store and display them to provide the Service.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">9. Termination</h2>
              <p>I may restrict or terminate access to the Service in case of a violation of these Terms, with prior warning where reasonably possible.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">10. Your data</h2>
              <p>Data is used to operate and synchronise the application. Feed personalisation is calculated in your browser. We do not sell your data. See the <router-link to="/privacy" class="link link-primary">Privacy Policy</router-link> for details.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">11. Governing law</h2>
              <p>These Terms are governed by Croatian law, without prejudice to any mandatory consumer protection rights you may have under EU law, where applicable.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">12. Changes to these Terms</h2>
              <p>These Terms may be updated from time to time. The date at the top always reflects the latest revision. I'll try to give advance notice of any major changes.</p>
            </div>

            <div class="space-y-2">
              <h2 class="text-xl font-bold">13. Contact</h2>
              <p>Got a question or concern? Feel free to reach out — happy to help 🙌 <a href="mailto:mario@barisa.me" class="link link-primary">mario@barisa.me</a></p>
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
