
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: response.credential,
          }),
        });

        if (res.ok) {
          router.push("/events");
          router.refresh();
        } else {
          const data = await res.json().catch(() => null);
          alert(data?.error || "Échec de la connexion");
        }
      } catch (err) {
        console.error("Login request error:", err);
        alert("Erreur de connexion au serveur");
      }
    },
    [router]
  );

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    const initializeGoogleSignIn = () => {
      if (!buttonRef.current || !window.google?.accounts?.id) return;

      if (!clientId) {
        console.warn(
          "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in .env. Google login requires this key."
        );
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: 400,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleCredentialResponse]);

  return (
    <main className={styles.page}>

      {/* Background circle */}
      <div className={styles.backgroundCircle} />

      {/* Top-left decorations */}
      <Image
        src="/Flip the card.svg"
        alt=""
        width={248}
        height={182}
        className={styles.flipCard}
        priority
      />

      <Image
        src="/Make the decision.svg"
        alt=""
        width={267}
        height={195}
        className={styles.makeDecision}
        priority
      />
      <Image
        src="/vector 39.svg"
        alt=""
        width={267}
        height={195}
        className={styles.vector39}
        priority
      />

      {/* Top-right decoration */}
      <Image
        src="/Layer 25.svg"
        alt=""
        width={476}
        height={497}
        className={styles.layer25}
        priority
      />

      {/* Bottom-left decoration */}
      <Image
        src="/group 90.png"
        alt=""
        width={564}
        height={513}
        className={styles.group90}
        priority
      />

      {/* Login */}
      <section className={styles.loginContent}>

        <Image
          src="/logo etic.svg"
          alt="ETIC"
          width={204}
          height={175}
          className={styles.logo}
          priority
        />

        <h1 className={styles.title}>
          <span className={styles.welcome}>
            WELCOME TO
          </span>

          <span className={styles.decision}>
            DecisionDeck
          </span>
        </h1>

        {/* Custom-looking Google button */}
        <div className={styles.googleWrapper}>

          <div className={styles.customGoogleButton}>
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={24}
              height={24}
              className={styles.googleIcon}
            />

            <span>Continue with Google</span>
          </div>

          {/* REAL Google button ON TOP */}
          <div
            ref={buttonRef}
            className={styles.realGoogleButton}
          />

        </div>

        <p className={styles.hint}>
          Sign in with your Google account to proceed.
          <br />
          Your role permissions are automatically applied upon login.
        </p>

      </section>

    </main>
  );
}
