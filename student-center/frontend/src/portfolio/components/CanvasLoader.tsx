import { Html } from "@react-three/drei";

export const CanvasLoader = () => {
  return (
    <Html
      as="div"
      center
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #db2777',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <p
        style={{
          fontSize: 16,
          color: "#db2777", // pink-600 to match theme
          fontWeight: 800,
          marginTop: 20,
        }}
      >
        Đang tải mô hình 3D... (Có thể mất vài giây)
      </p>
    </Html>
  );
};
