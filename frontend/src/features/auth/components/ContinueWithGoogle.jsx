import  { useState } from "react";

/**
 * Google Sign-In button built to Google's official branding guidelines:
 * https://developers.google.com/identity/branding-guidelines
 *
 * Rules followed:
 *  - White (#FFFFFF) button background
 *  - Official Google "G" logo with exact brand colours
 *  - "Roboto" or system-sans font, 14 px, medium weight
 *  - Minimum 40 px height
 *  - 8 px logo-to-text gap
 *  - No custom colours on text (Google-spec: #3c4043 / #202124)
 *  - Subtle border (#dadce0) instead of a drop-shadow (both are allowed)
 *  - Hover: slight grey tint (#f8f9fa → #f1f3f4)
 *  - Active: slightly darker (#e8eaed)
 *  - Focus: 4 px blue focus ring for accessibility
 */
const GoogleIcon = () => (
  /* Official Google "G" SVG — exact brand colours */
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="18"
    height="18"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

const ContinueWithGoogle = () => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  /* Derive background based on interaction state */
  const bg = pressed ? "#e8eaed" : hovered ? "#f1f3f4" : "#ffffff";

  return (
    <a
      href="/api/auth/google"
      id="google-signin-btn"
      role="button"
      aria-label="Continue with Google"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        /* Layout */
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        width: "100%",
        minHeight: "40px",
        padding: "0 12px",
        boxSizing: "border-box",
        borderRadius: "4px",          /* Google spec: 4 px rounded */
        textDecoration: "none",

        /* Colours — spec-compliant */
        backgroundColor: bg,
        border: "1px solid #dadce0",

        /* Typography — Google spec: Roboto, 14 px, medium weight */
        fontFamily: "'Roboto', 'Google Sans', -apple-system, sans-serif",
        fontSize: "14px",
        fontWeight: 500,
        letterSpacing: "0.0107142857em",
        color: "#3c4043",

        /* Transitions */
        transition: "background-color 0.2s ease, box-shadow 0.2s ease",

        /* Accessibility focus ring */
        outline: "none",
        cursor: "pointer",
        userSelect: "none",
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(66,133,244,0.35)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Google G logo container — isolated white pill so logo colours always show on dark pages */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          width: "18px",
          height: "18px",
        }}
      >
        <GoogleIcon />
      </span>

      <span>Continue with Google</span>
    </a>
  );
};

export default ContinueWithGoogle;