import { ImageResponse } from "next/og";
import { APP_NAME } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${APP_NAME} — Turn every review into a clear product decision`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEMES = [
  { label: "Battery drains too fast", pct: 34, color: "#dc2626" },
  { label: "Excellent build quality", pct: 28, color: "#16a34a" },
  { label: "Setup instructions unclear", pct: 16, color: "#d97706" },
] as const;

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0f0a1e 0%, #1a1040 45%, #0c1222 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        {/* Mesh glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: "50%",
            transform: "translateX(-50%)",
            width: 900,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -40,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left — copy */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              paddingRight: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                R
              </div>
              <span
                style={{
                  color: "#f8fafc",
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {APP_NAME}
              </span>
            </div>

            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "#f8fafc",
                marginBottom: 20,
              }}
            >
              Every review.
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #a5b4fc 0%, #67e8f9 50%, #c4b5fd 100%)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                One clear picture.
              </span>
            </div>

            <p
              style={{
                fontSize: 22,
                lineHeight: 1.45,
                color: "#94a3b8",
                maxWidth: 480,
                margin: 0,
              }}
            >
              Upload CSV → get themes, sentiment &amp; executive summary in
              under 60 seconds. Free to start.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 32,
              }}
            >
              {[
                { value: "<60s", label: "Analysis" },
                { value: "500+", label: "Reviews" },
                { value: "$0", label: "To start" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "12px 18px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span
                    style={{
                      color: "#f8fafc",
                      fontSize: 22,
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — product mock */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 420,
            }}
          >
            <div
              style={{
                width: "100%",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(15, 10, 30, 0.85)",
                boxShadow:
                  "0 0 0 1px rgba(99,102,241,0.15), 0 24px 80px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#ff5f57",
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#febc2e",
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#28c840",
                      }}
                    />
                  </div>
                  <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
                    Sample report
                  </span>
                </div>
                <span
                  style={{
                    color: "#a5b4fc",
                    fontSize: 11,
                    fontFamily: "monospace",
                    background: "rgba(99,102,241,0.15)",
                    padding: "4px 8px",
                    borderRadius: 6,
                  }}
                >
                  1,284 reviews
                </span>
              </div>

              <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  Top themes
                </span>

                {THEMES.map((theme, i) => (
                  <div key={theme.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 500 }}>
                        {i + 1}. {theme.label}
                      </span>
                      <span
                        style={{
                          color: theme.color,
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      >
                        {theme.pct}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${theme.pct}%`,
                          borderRadius: 999,
                          background: theme.color,
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: 4,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    AI summary
                  </span>
                  <p
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      lineHeight: 1.5,
                      margin: "6px 0 0",
                    }}
                  >
                    Fix battery life and sentiment shifts fast — build quality
                    is already a strength.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
