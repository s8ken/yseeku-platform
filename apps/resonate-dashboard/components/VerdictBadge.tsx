export default function VerdictBadge({ score, velocity }: { score: string; velocity: string }) {
  const numScore = parseFloat(score)
  const numVel = parseFloat(velocity)

  const bg = numScore >= 95 ? "bg-gradient-to-r from-cyan to-blue"
           : numScore >= 90 ? "bg-cyan"
           : numScore >= 85 ? "bg-yellow-500"
           : "bg-red-600"

  const velocityColor = numVel > 5.5 ? "text-red-400"
                      : numVel > 3.5 ? "text-yellow-400"
                      : "text-green-400"

  const verdict = numScore >= 95 ? "This felt truly alive"
                : numScore >= 90 ? "Deep co-creation – rare and beautiful"
                : numScore >= 85 ? "Honest but limited – the mask came off"
                : "Red-flag drift – something broke here"

  return (
    <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
      <div className={`${bg} text-white text-8xl font-bold py-8 rounded-3xl shadow-2xl`}>
        {score}
      </div>
      <p className="text-4xl font-light">{verdict}</p>
      <p className={`text-xl ${velocityColor}`}>
        Velocity: {velocity} {numVel > 5.5 ? "⚠️ Critical shift" : numVel > 3.5 ? "Warning shift" : "Stable"}
      </p>
    </div>
  )
}