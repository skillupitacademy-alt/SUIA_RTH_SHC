const domains = [
  'Full Stack',
  'Data Analyst',
  'Data Science',
  'Cyber Security',
  'Ethical Hacking',
];

export function DomainPaths() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl mb-3">Choose Your Path</h2>
          <p className="text-xl text-gray-600">
            Expertly crafted quizzes for career growth
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {domains.map((domain, index) => (
            <button
              key={index}
              className="px-8 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 hover:border-pink-600 hover:text-pink-600 transition-all"
            >
              {domain}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
