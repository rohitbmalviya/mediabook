import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'MediBook — Book Doctor Appointments Online';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          <div
            style={{
              background: '#ffffff',
              width: 160,
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 40,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" fill="#008689" />
              <path d="M5 12.5H8L9.5 9L12 16L14 12.5H19" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 19C12 19 5 15 5 10.5C5 8 7 6.5 9 6.5C10.5 6.5 11.5 7.5 12 8.5C12.5 7.5 13.5 6.5 15 6.5C17 6.5 19 8 19 10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            marginBottom: 20,
            textAlign: 'center',
            color: '#0f172a',
          }}
        >
          MediBook
        </h1>
        <p
          style={{
            fontSize: 36,
            color: '#475569',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Book Doctor Appointments Online. Find and book with trusted healthcare professionals near you.
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
