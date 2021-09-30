class SlackMessage {
	constructor(author, timestamp, thread_id, text, is_reply=false, children=[]) {
		this.author = author;
		this.timestamp = timestamp;
		this.log_time = this.parse_timestamp(timestamp);
		this.text = text;
		this.thread_id = thread_id;
		this.is_reply = is_reply;
		this.children = children;
		
		this.full_text = this.construct_full_text();
		
	}

	// Adding children 
	add_child(child) {
		this.children.push(child);
	}
	
	// Helper functions
	parse_timestamp(timestamp) {
		const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		const MERIDIANS = ["AM", "PM"];

		// Format: [Day MM/DD/YYYY hh:mm AP]
		let d = new Date(1000 * timestamp);
		let day_id = d.getDay();
		let day = DAYS[day_id];
		
		let month_id = d.getMonth() + 1;
		month_id = String(month_id).padStart(2, '0');
		let day_num = d.getDate();
		day_num = String(day_num).padStart(2, '0');
		let year = d.getFullYear();
		
		let hour = d.getHours() % 12;
		hour = String(hour).padStart(2, '0');
		let minutes = d.getMinutes();
		minutes = String(minutes).padStart(2, '0');
		let meridian = MERIDIANS[parseInt(d.getHours() / 12)];
		
		let english_time = `${day}, ${month_id}/${day_num}/${year}, ${hour}:${minutes} ${meridian}`;
		return english_time;
	}
	
	construct_full_text() {
		if (this.is_reply) {
			return `>>>> [${this.log_time}] ${this.author}: ${this.text}\n`;
		} else {
			return `[${this.log_time}] ${this.author}: ${this.text}\n`;
		}
	}
}