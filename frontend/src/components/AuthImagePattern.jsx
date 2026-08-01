const flowerColors = [
  "text-purple-400", "text-pink-400", "text-blue-400",
  "text-violet-400", "text-fuchsia-400", "text-indigo-400",
];

const petalCounts = [5, 6, 5, 6, 5, 6];

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => {
            const petals = petalCounts[i % petalCounts.length];
            const color = flowerColors[i % flowerColors.length];
            const angleStep = 360 / petals;

            return (
              <div
                key={i}
                className="group aspect-square rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden cursor-pointer transition-colors hover:bg-primary/20"
              >
                <svg
                  viewBox="0 0 100 100"
                  className={`w-3/4 h-3/4 bloom-flower ${color} transition-transform duration-500 group-hover:scale-125`}
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <g className="petals">
                    {[...Array(petals)].map((_, p) => (
                      <ellipse
                        key={p}
                        cx="50"
                        cy="28"
                        rx="9"
                        ry="18"
                        fill="currentColor"
                        opacity="0.8"
                        transform={`rotate(${p * angleStep} 50 50)`}
                      />
                    ))}
                  </g>
                  <circle cx="50" cy="50" r="7" fill="currentColor" className="glow-dot" />
                </svg>
              </div>
            );
          })}
        </div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-base-content/60">{subtitle}</p>
      </div>

      <style>{`
        .bloom-flower {
          transform-origin: center;
          transform: scale(0);
          opacity: 0;
          animation: bloomFloat 4s ease-in-out infinite;
        }

        .glow-dot {
          filter: drop-shadow(0 0 4px currentColor);
        }

        @keyframes bloomFloat {
          0% {
            transform: scale(0) translateY(0) rotate(0deg);
            opacity: 0;
          }
          25% {
            transform: scale(1) translateY(0) rotate(10deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.05) translateY(-6px) rotate(0deg);
            opacity: 1;
          }
          75% {
            transform: scale(1) translateY(0) rotate(-8deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.85) translateY(0) rotate(0deg);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthImagePattern;

// const AuthImagePattern = ({ title, subtitle }) => {
//   return (
//     <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
//       <div className="max-w-md text-center">
//         <div className="grid grid-cols-3 gap-3 mb-8">
//           {[...Array(9)].map((_, i) => (
//             <div
//               key={i}
//               className={`aspect-square rounded-2xl bg-primary/10 ${
//                 i % 2 === 0 ? "animate-pulse" : ""
//               }`}
//             />
//           ))}
//         </div>

//         <h2 className="text-2xl font-bold mb-4">{title}</h2>
//         <p className="text-base-content/60">{subtitle}</p>
//       </div>
//     </div>
//   );
// };

// export default AuthImagePattern;