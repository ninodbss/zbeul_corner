export default function Home() {
  return (
    <main>
      <h1 style={{ marginTop: 8 }}>Choisis ton son de leader 🥇</h1>
      <p style={{ lineHeight: 1.5 }}>
        Connecte ton compte TikTok, puis choisis un son (issu de la Commercial Music Library) pour ta bille.
        Quand tu passes leader sur le live, ton son peut être déclenché.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <a
          href="/api/auth/tiktok"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            background: "black",
            color: "white",
            textDecoration: "none"
          }}
        >
          Continuer avec TikTok
        </a>

        <a
          href="/sounds"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ccc",
            textDecoration: "none"
          }}
        >
          Voir la liste des sons
        </a>
      </div>
    </main>
  );
}
