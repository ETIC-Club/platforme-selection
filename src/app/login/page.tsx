// "use client";

// import { useEffect, useRef } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import styles from "./login.module.css";

// declare global {
//   interface Window {
//     google: any;
//   }
// }

// export default function LoginPage() {
//   const router = useRouter();
//   const buttonRef = useRef<HTMLDivElement>(null);

//   async function handleCredentialResponse(response: {
//     credential: string;
//   }) {
//     const res = await fetch("/api/auth/google", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         credential: response.credential,
//       }),
//     });

//     if (res.ok) {
//       router.push("/events");
//       router.refresh();
//     } else {
//       alert("Échec de la connexion");
//     }
//   }

//   useEffect(() => {
//     const script = document.createElement("script");

//     script.src = "https://accounts.google.com/gsi/client";
//     script.async = true;

//     script.onload = () => {
//       if (!buttonRef.current) return;

//       window.google.accounts.id.initialize({
//         client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
//         callback: handleCredentialResponse,
//       });

//       window.google.accounts.id.renderButton(
//         buttonRef.current,
//         {
//           theme: "outline",
//           size: "large",
//           text: "continue_with",
//           shape: "pill",
//           width: 330,
//         }
//       );
//     };

//     document.body.appendChild(script);

//     return () => {
//       document.body.removeChild(script);
//     };
//   }, []);

//   return (
//     <main className={styles.page}>
//       {/* Top-right decorative line */}
//       <Image
//         src="/Layer 2.svg"
//         alt=""
//         width={100}
//         height={80}
//         className={styles.squiggle}
//       />

//       <div className={styles.card}>
//         {/* ETIC logo - top left */}
//         <div className={styles.logoRow}>
//           <Image
//             src="/logo etic.svg"
//             alt="ETIC"
//             width={56}
//             height={56}
//             className={styles.logo}
//           />
//         </div>

//         {/* Main content */}
//         <div className={styles.content}>
//           <h1 className={styles.title}>
//             WELCOME TO
//             <br />
//             <span className={styles.gradRedOrange}>
//               Decision Deck
//             </span>
//           </h1>

//           {/* Tagline with green decoration */}
//           <div className={styles.taglineRow}>
//             <Image
//               src="/Layer 23.svg"
//               alt=""
//               width={28}
//               height={28}
//             />

//             <p className={styles.tagline}>
//               flip the card, make the decision
//             </p>
//           </div>

//           {/* Google renders its official button here */}
//           <div
//             ref={buttonRef}
//             className={styles.googleButton}
//           />

//           <p className={styles.hint}>
//             Sign in with your Google account to proceed.
//             <br />
//             Your role permissions are automatically applied
//             upon login.
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }
// // "use client";

// // import { useEffect, useRef } from "react";
// // import { useRouter } from "next/navigation";

// // declare global {
// //   interface Window {
// //     google: any;
// //   }
// // }

// // export default function LoginPage() {
// //   const router = useRouter();
// //   const buttonRef = useRef<HTMLDivElement>(null);

// //   async function handleCredentialResponse(response: { credential: string }) {
// //     const res = await fetch("/api/auth/google", {
// //       method: "POST",
// //       headers: { "Content-Type": "application/json" },
// //       body: JSON.stringify({ credential: response.credential }),
// //     });

// //     if (res.ok) {
// //       router.push("/events");
// //       router.refresh();
// //     } else {
// //       alert("Échec de la connexion");
// //     }
// //   }

// //   useEffect(() => {
// //     const script = document.createElement("script");
// //     script.src = "https://accounts.google.com/gsi/client";
// //     script.async = true;
// //     script.onload = () => {
// //       window.google.accounts.id.initialize({
// //         client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
// //         callback: handleCredentialResponse,
// //       });
// //       window.google.accounts.id.renderButton(buttonRef.current, {
// //         theme: "outline",
// //         size: "large",
// //       });
// //     };
// //     document.body.appendChild(script);
// //     return () => {
// //       document.body.removeChild(script);
// //     };
// //   }, []);

// //   return (
// //     <main style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
// //       <div ref={buttonRef} />
// //     </main>
// //   );
// // }

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";

declare global {
  interface Window {
    google: any;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);

  async function handleCredentialResponse(response: {
    credential: string;
  }) {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential: response.credential,
      }),
    });
    //if logged in successfuly, redirect to /events
    if (res.ok) {
      router.push("/events");
      router.refresh();
    } else {
      alert("Échec de la connexion");
    }
  }

  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      if (!buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
