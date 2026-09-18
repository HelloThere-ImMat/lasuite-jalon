import AppIntents

// Talks to the backend's POST /tasks/from-text directly (API_DOCS.md),
// the same endpoint CreateTaskBar.tsx uses (docs/DECISIONS.md, "Task creation
// UI: single free-text field + dictation") — not through the Capacitor
// WebView/JS layer, which may not exist yet when Siri invokes this
// (docs/audits/app-intents-siri.md, "What App Intents actually is").
struct AddTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Ajouter une tâche"
    static var description = IntentDescription("Ajoute une tâche à Jalon à partir d'un texte libre.")

    @Parameter(title: "Tâche")
    var text: String

    // Deployed backend base URL (API_DOCS.md). Not subject to CORS: this is a
    // native request, not a browser one.
    static let apiBase = "https://nudge.ovh/api/lasuite-jalon"

    func perform() async throws -> some IntentResult & ProvidesDialog {
        var request = URLRequest(url: URL(string: "\(Self.apiBase)/tasks/from-text")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "text": text,
            "timeZone": TimeZone.current.identifier,
        ])
        let (_, response) = try await URLSession.shared.data(for: request)
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            return .result(dialog: "Impossible d'ajouter la tâche.")
        }
        return .result(dialog: "Tâche ajoutée : \(text)")
    }
}
