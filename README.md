# 🏡 Casetta

Benvenuti nel progetto **Casetta**! ❤️
Questo sito è stato creato appositamente per me e la mia ragazza per aiutarci nella gestione quotidiana della nostra convivenza. È uno spazio condiviso in cui organizzare link, risorse e informazioni utili per la nostra casa.

---

## 🛠️ Per chi volesse scaricarlo e utilizzarlo (Deploy personalizzato)

Se trovi utile questo progetto e vuoi crearne una copia per la tua convivenza, puoi scaricarlo ed effettuare il deploy per conto tuo. Segui questi semplici passaggi:

### 1. Clona il repository
```bash
git clone https://github.com/PierpaoloBene/Casetta_web_app.git
cd Casetta_web_app
```

### 2. Installa le dipendenze
Assicurati di avere [Node.js](https://nodejs.org/) installato sul tuo computer.
```bash
npm install
```

### 3. Configura il Database (Supabase)
Questo progetto utilizza [Supabase](https://supabase.com/) come database e backend.
1. Crea un nuovo account e un nuovo progetto su Supabase.
2. Dal pannello di controllo del tuo progetto Supabase, vai all'editor SQL.
3. Copia il contenuto del file `supabase/database.sql` (che trovi in questa repository) e avvia la query per generare la struttura del database necessaria.
4. Nelle impostazioni del tuo progetto Supabase (Project Settings > API), recupera il tuo **Project URL** e la **Project API Key (anon/public)**.

### 4. Imposta le Variabili d'Ambiente
Crea un file chiamato `.env.local` nella cartella principale del progetto e inserisci le chiavi che hai appena recuperato:

```env
NEXT_PUBLIC_SUPABASE_URL=il_tuo_project_url_qui
NEXT_PUBLIC_SUPABASE_ANON_KEY=la_tua_anon_key_qui
```

### 5. Avvia il progetto in locale
Per testare il sito e apportare modifiche:
```bash
npm run dev
```
Apri il browser su [http://localhost:3000](http://localhost:3000).

### 6. Deploy
Il progetto è pronto per essere pubblicato!
- **Su Vercel (Consigliato):** Crea un account su Vercel, collega il tuo repository di GitHub e inserisci le variabili d'ambiente (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) nelle impostazioni di Vercel prima del deploy.
- **Su GitHub Pages:** Assicurati di aggiungere le GitHub Actions adeguate per l'esportazione statica di Next.js e imposta `output: 'export'` nel file `next.config.mjs`. Ricordati di impostare i *Repository Secrets* per le tue variabili d'ambiente!

---
Sviluppato con [Next.js](https://nextjs.org/) e tanto amore!
