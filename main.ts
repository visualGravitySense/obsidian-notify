import {
	Plugin,
	TFile,
	Notice,
	WorkspaceLeaf,
	ItemView,
	setIcon,
	Editor,
	MarkdownView,
	Modal,
	App,
	Setting,
} from "obsidian";

interface NotificationItem {
	id: string;
	datetime: Date;
	message: string;
	file: string;
	lineNumber: number;
	triggered: boolean;
}

const VIEW_TYPE_NOTIFICATIONS = "notifications-view";

class DateTimePickerModal extends Modal {
	editor: Editor;
	cursorPos: any;
	onSubmit: (datetime: Date, message: string) => void;

	constructor(
		app: App,
		editor: Editor,
		cursorPos: any,
		onSubmit: (datetime: Date, message: string) => void,
	) {
		super(app);
		this.editor = editor;
		this.cursorPos = cursorPos;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: "Create Notification" });

		const container = contentEl.createDiv("datetime-picker-container");

		// Default to current date/time + 1 hour
		const now = new Date();
		const defaultDateTime = new Date(now.getTime() + 60 * 60 * 1000);

		let selectedDate = defaultDateTime.toISOString().split("T")[0];
		let selectedHour = defaultDateTime.getHours().toString().padStart(2, "0");
		let selectedMinute = defaultDateTime
			.getMinutes()
			.toString()
			.padStart(2, "0");
		let message = "";

		// Date input
		new Setting(container).setName("Date").addText((text) => {
			text
				.setPlaceholder("YYYY-MM-DD")
				.setValue(selectedDate)
				.onChange((value) => (selectedDate = value));
			text.inputEl.type = "date";
			text.inputEl.addClass("datetime-picker-date");
		});

		// Time container
		const timeContainer = container.createDiv("time-picker-container");
		timeContainer.createEl("label", { text: "Time:", cls: "time-label" });

		const timeInputContainer = timeContainer.createDiv("time-input-container");

		// Hour input
		const hourInput = timeInputContainer.createEl("input", {
			type: "number",
			cls: "time-input hour-input",
		});
		hourInput.min = "0";
		hourInput.max = "23";
		hourInput.value = selectedHour;
		hourInput.addEventListener("change", (e) => {
			selectedHour = (e.target as HTMLInputElement).value.padStart(2, "0");
		});

		timeInputContainer.createEl("span", { text: ":", cls: "time-separator" });

		// Minute input
		const minuteInput = timeInputContainer.createEl("input", {
			type: "number",
			cls: "time-input minute-input",
		});
		minuteInput.min = "0";
		minuteInput.max = "59";
		minuteInput.step = "5";
		minuteInput.value = selectedMinute;
		minuteInput.addEventListener("change", (e) => {
			selectedMinute = (e.target as HTMLInputElement).value.padStart(2, "0");
		});

		// Message input
		new Setting(container).setName("Message").addText((text) => {
			text
				.setPlaceholder("Enter your notification message...")
				.setValue(message)
				.onChange((value) => (message = value));
			text.inputEl.addClass("message-input");
			// Focus on message input by default
			setTimeout(() => text.inputEl.focus(), 100);
		});

		// Quick time buttons
		const quickTimeContainer = container.createDiv("quick-time-container");
		quickTimeContainer.createEl("label", {
			text: "Quick select:",
			cls: "quick-time-label",
		});

		const quickTimes = [
			{ label: "+15min", minutes: 15 },
			{ label: "+30min", minutes: 30 },
			{ label: "+1hr", minutes: 60 },
			{ label: "+2hr", minutes: 120 },
			{ label: "+1day", minutes: 24 * 60 },
		];

		const quickButtonsContainer = quickTimeContainer.createDiv(
			"quick-buttons-container",
		);
		quickTimes.forEach(({ label, minutes }) => {
			const button = quickButtonsContainer.createEl("button", {
				text: label,
				cls: "quick-time-button",
			});
			button.addEventListener("click", (e) => {
				e.preventDefault();
				const quickDateTime = new Date(now.getTime() + minutes * 60 * 1000);
				selectedDate = quickDateTime.toISOString().split("T")[0];
				selectedHour = quickDateTime.getHours().toString().padStart(2, "0");
				selectedMinute = quickDateTime.getMinutes().toString().padStart(2, "0");

				// Update the input fields
				(
					container.querySelector(".datetime-picker-date") as HTMLInputElement
				).value = selectedDate;
				hourInput.value = selectedHour;
				minuteInput.value = selectedMinute;
			});
		});

		// Action buttons
		const buttonContainer = container.createDiv("button-container");

		const createButton = buttonContainer.createEl("button", {
			text: "Create Notification",
			cls: "mod-cta create-button",
		});

		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
			cls: "cancel-button",
		});

		createButton.addEventListener("click", () => {
			if (
				!selectedDate ||
				!selectedHour ||
				!selectedMinute ||
				!message.trim()
			) {
				new Notice("Please fill in all fields");
				return;
			}

			const [year, month, day] = selectedDate.split("-").map(Number);
			const datetime = new Date(
				year,
				month - 1,
				day,
				Number(selectedHour),
				Number(selectedMinute),
			);

			if (isNaN(datetime.getTime())) {
				new Notice("Invalid date/time");
				return;
			}

			if (datetime <= new Date()) {
				new Notice("Notification time must be in the future");
				return;
			}

			this.onSubmit(datetime, message.trim());
			this.close();
		});

		cancelButton.addEventListener("click", () => {
			this.close();
		});

		// Add styles
		this.addStyles();
	}

	private addStyles() {
		const style = document.createElement("style");
		style.textContent = `
            .datetime-picker-container {
                padding: 20px 0;
            }

            .time-picker-container {
                margin: 15px 0;
            }

            .time-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }

            .time-input-container {
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .time-input {
                width: 60px;
                padding: 6px 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                text-align: center;
            }

            .time-separator {
                font-weight: bold;
                color: var(--text-muted);
            }

            .message-input {
                width: 100% !important;
            }

            .quick-time-container {
                margin: 15px 0;
            }

            .quick-time-label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
            }

            .quick-buttons-container {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .quick-time-button {
                padding: 6px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-secondary);
                color: var(--text-normal);
                cursor: pointer;
                font-size: 12px;
            }

            .quick-time-button:hover {
                background: var(--background-modifier-hover);
            }

            .button-container {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .create-button {
                padding: 8px 16px;
            }

            .cancel-button {
                padding: 8px 16px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
            }
        `;
		document.head.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class NotificationsView extends ItemView {
	plugin: NotificationPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: NotificationPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_NOTIFICATIONS;
	}

	getDisplayText() {
		return "Notifications";
	}

	getIcon() {
		return "bell";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h4", { text: "Pending Notifications" });

		this.renderNotifications();
	}

	renderNotifications() {
		const container = this.containerEl.children[1];
		const existingList = container.querySelector(".notification-list");
		if (existingList) {
			existingList.remove();
		}

		const listEl = container.createDiv("notification-list");

		const pendingNotifications = this.plugin.notifications
			.filter((n) => !n.triggered && n.datetime > new Date())
			.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

		if (pendingNotifications.length === 0) {
			listEl.createEl("p", {
				text: "No pending notifications",
				cls: "notification-empty",
			});
			return;
		}

		pendingNotifications.forEach((notification) => {
			const itemEl = listEl.createDiv("notification-item");

			const timeEl = itemEl.createEl("div", {
				text: this.formatDateTime(notification.datetime),
				cls: "notification-time",
			});

			const messageEl = itemEl.createEl("div", {
				text: notification.message,
				cls: "notification-message",
			});

			const sourceEl = itemEl.createEl("div", {
				text: `${notification.file}:${notification.lineNumber}`,
				cls: "notification-source",
			});

			// Make source clickable to navigate to the file
			sourceEl.addEventListener("click", async () => {
				const file = this.app.vault.getAbstractFileByPath(notification.file);
				if (file instanceof TFile) {
					const leaf = this.app.workspace.getUnpinnedLeaf();
					await leaf.openFile(file);

					// Jump to the line number
					const view = leaf.view;
					if (view.getViewType() === "markdown") {
						const editor = (view as any).editor;
						if (editor) {
							editor.setCursor(notification.lineNumber - 1, 0);
						}
					}
				}
			});
		});
	}

	private formatDateTime(date: Date): string {
		return date.toLocaleString();
	}

	async onClose() {
		// Nothing to clean up
	}
}

export default class NotificationPlugin extends Plugin {
	notifications: NotificationItem[] = [];
	checkInterval: number;
	statusBarItem: HTMLElement;

	async onload() {
		console.log("Loading Notification Plugin");

		// Register the custom view
		this.registerView(
			VIEW_TYPE_NOTIFICATIONS,
			(leaf) => new NotificationsView(leaf, this),
		);

		// Add ribbon icon
		this.addRibbonIcon("bell", "Notifications", () => {
			this.activateView();
		});

		// Add status bar item
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Register editor extension for [notify] trigger
		this.registerEditorExtension([this.createNotifyTrigger()]);

		// Scan for notifications on startup
		await this.scanForNotifications();

		// Set up periodic checking (every minute)
		this.checkInterval = window.setInterval(() => {
			this.checkNotifications();
		}, 60000);

		// Listen for file changes
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.scanFileForNotifications(file);
				}
			}),
		);

		// Listen for file creation
		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (file instanceof TFile && file.extension === "md") {
					this.scanFileForNotifications(file);
				}
			}),
		);

		// Listen for file deletion
		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) {
					this.removeNotificationsFromFile(file.path);
				}
			}),
		);
	}

	private createNotifyTrigger() {
		const plugin = this;

		return {
			update: (view: any) => {
				// This is a simplified approach - in a full implementation,
				// you'd use CodeMirror 6 extensions for better integration
				return [];
			},
		};
	}

	// Register command for manual notification creation
	private registerCommands() {
		this.addCommand({
			id: "create-notification",
			name: "Create notification",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.openDateTimePicker(editor);
			},
		});
	}

	private openDateTimePicker(editor: Editor) {
		const cursor = editor.getCursor();

		new DateTimePickerModal(
			this.app,
			editor,
			cursor,
			(datetime: Date, message: string) => {
				const year = datetime.getFullYear();
				const month = String(datetime.getMonth() + 1).padStart(2, "0");
				const day = String(datetime.getDate()).padStart(2, "0");
				const hours = String(datetime.getHours()).padStart(2, "0");
				const minutes = String(datetime.getMinutes()).padStart(2, "0");

				const notificationText = `[notify]@${year}-${month}-${day}:${hours}-${minutes} ${message}`;

				// Replace [notify] if it exists at cursor, otherwise insert
				const currentLine = editor.getLine(cursor.line);
				const notifyIndex = currentLine.indexOf("[notify]");

				if (notifyIndex !== -1) {
					// Replace the [notify] part
					editor.replaceRange(
						notificationText,
						{ line: cursor.line, ch: notifyIndex },
						{ line: cursor.line, ch: notifyIndex + 8 },
					);
				} else {
					// Insert at cursor position
					editor.replaceRange(notificationText, cursor);
				}

				new Notice("Notification created successfully!");
			},
		).open();
	}

	async onunload() {
		console.log("Unloading Notification Plugin");
		if (this.checkInterval) {
			window.clearInterval(this.checkInterval);
		}
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTIFICATIONS);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_NOTIFICATIONS, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	private async scanForNotifications() {
		this.notifications = [];
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			await this.scanFileForNotifications(file);
		}

		this.updateStatusBar();
		this.refreshView();
	}

	private async scanFileForNotifications(file: TFile) {
		try {
			const content = await this.app.vault.read(file);
			const lines = content.split("\n");

			// Remove existing notifications from this file
			this.removeNotificationsFromFile(file.path);

			const notificationRegex =
				/\[notify\]@(\d{4}-\d{2}-\d{2}):(\d{2})-(\d{2})\s+(.+)/;

			lines.forEach((line, index) => {
				const match = line.match(notificationRegex);
				if (match) {
					const [, datePart, hours, minutes, message] = match;
					const [year, month, day] = datePart.split("-").map(Number);

					const notificationDate = new Date(
						year,
						month - 1,
						day,
						Number(hours),
						Number(minutes),
					);

					if (!isNaN(notificationDate.getTime())) {
						const notification: NotificationItem = {
							id: `${file.path}:${index + 1}:${notificationDate.getTime()}`,
							datetime: notificationDate,
							message: message.trim(),
							file: file.path,
							lineNumber: index + 1,
							triggered: notificationDate <= new Date(),
						};

						this.notifications.push(notification);
					}
				}
			});
		} catch (error) {
			console.error("Error scanning file for notifications:", error);
		}

		this.updateStatusBar();
		this.refreshView();
	}

	private removeNotificationsFromFile(filePath: string) {
		this.notifications = this.notifications.filter((n) => n.file !== filePath);
	}

	private checkNotifications() {
		const now = new Date();
		let hasNewNotifications = false;

		this.notifications.forEach((notification) => {
			if (!notification.triggered && notification.datetime <= now) {
				notification.triggered = true;
				new Notice(`📅 Reminder: ${notification.message}`, 8000);
				hasNewNotifications = true;
			}
		});

		if (hasNewNotifications) {
			this.updateStatusBar();
			this.refreshView();
		}
	}

	private updateStatusBar() {
		const pendingCount = this.notifications.filter(
			(n) => !n.triggered && n.datetime > new Date(),
		).length;
		this.statusBarItem.setText(`🔔 ${pendingCount}`);
		this.statusBarItem.title = `${pendingCount} pending notifications`;
	}

	private refreshView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTIFICATIONS);
		leaves.forEach((leaf) => {
			if (leaf.view instanceof NotificationsView) {
				leaf.view.renderNotifications();
			}
		});
	}
}
