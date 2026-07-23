"use client";

import { useState } from "react";
import HighlightIcon from "@/components/HighlightIcon";
import { useReveal } from "@/lib/useReveal";

const HIGHLIGHTS: { i: "HEART" | "BROWSER" | "PLANT"; t: string; c: "magenta" | "cyan" | "green" }[] = [
  { i: "HEART", t: "HECHO CON ❤️ PARA JUGADORES", c: "magenta" },
  { i: "BROWSER", t: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", c: "cyan" },
  { i: "PLANT", t: "PROYECTO EN CONSTANTE CRECIMIENTO", c: "green" },
];

type SubmitState = "idle" | "sending" | "success" | "error";

export default function About() {
  useReveal();

  const [form, setForm] = useState({ name: "", email: "", msg: "", hp: "" });
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [shake, setShake] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setState("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "No se pudo enviar el mensaje. Intenta de nuevo más tarde.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setErrorMsg("No se pudo conectar con el servidor. Intenta de nuevo más tarde.");
      setState("error");
    }
  };

  const resetForm = () => {
    setState("idle");
    setForm({ name: "", email: "", msg: "", hp: "" });
  };

  return (
    <div className="about fade-in">
      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
          los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
          y sin costo.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className={"highlight " + h.c} style={{ transitionDelay: i * 80 + "ms" }}>
              <HighlightIcon kind={h.i} />
              <div className="hl-text pixel">{h.t}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider banner */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar"></div>
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: i * 80 + "ms" }}></span>
          ))}
        </div>
        <div className="div-bar"></div>
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip"><span className="tip-led"></span>RESPUESTA EN 24-48H</div>
              <div className="tip"><span className="tip-led y"></span>SUGERENCIAS BIENVENIDAS</div>
              <div className="tip"><span className="tip-led m"></span>SIN SPAM, JAMÁS</div>
            </div>
          </div>

          <form className={"contact-form" + (shake ? " shake" : "")} onSubmit={onSubmit}>
            {state === "success" ? (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {form.name.trim().toUpperCase()}.
                    <span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button className="btn ghost" type="button" onClick={resetForm}>
                      ENVIAR OTRO MENSAJE
                    </button>
                  </div>
                </div>
              </div>
            ) : state === "error" ? (
              <div className="terminal-success" style={{ borderColor: "var(--magenta)", boxShadow: "0 0 22px rgba(255,0,110,0.25)" }}>
                <div className="term-bar">
                  <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div
                    className="line success"
                    style={{ color: "var(--magenta)", textShadow: "0 0 6px rgba(255,0,110,0.45)" }}
                  >
                    &gt; ERROR: {errorMsg}
                    <span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button className="btn ghost" type="button" onClick={() => setState("idle")}>
                      INTENTAR DE NUEVO
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>NOMBRE</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="px_kai"
                  />
                </div>
                <div className="field">
                  <label>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jugador@vault.gg"
                  />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea
                    rows={5}
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                    placeholder="Cuéntanos qué tienes en mente…"
                  ></textarea>
                </div>
                <div style={{ display: "none" }}>
                  <label htmlFor="hp">No llenar este campo</label>
                  <input
                    id="hp"
                    name="hp"
                    value={form.hp}
                    onChange={(e) => setForm({ ...form, hp: e.target.value })}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <button
                  className="btn xl press"
                  type="submit"
                  style={{ width: "100%" }}
                  disabled={state === "sending"}
                >
                  {state === "sending" ? "ENVIANDO..." : "▶  ENVIAR MENSAJE"}
                </button>
              </>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
