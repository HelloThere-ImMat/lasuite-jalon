import AppIntents

// Makes AddTaskIntent discoverable in Siri/Spotlight/Shortcuts without the
// user having to build a Shortcut manually first (docs/audits/app-intents-siri.md,
// "What's realistically buildable"). iOS 27's Siri (WWDC 2026, same doc,
// "Second pass update") only surfaces intents exposed this way.
struct TasksShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: ["Ajoute une tâche à \(.applicationName)"],
            shortTitle: "Ajouter une tâche",
            systemImageName: "plus.circle"
        )
    }
}
