const tabs = ['Home', 'Workouts', 'Diet', 'Body & Plan', 'History', 'Backup']

export default function TopNav({ active, onChange }) {
  return (
    <nav className="mb-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={active === tab ? '' : 'secondary'}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
