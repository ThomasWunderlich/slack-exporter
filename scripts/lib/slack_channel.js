class SlackChannel {
	constructor(workspace, enterprise_workspace, channel, token, enterprise_token) {
		// Initialize core class variables
		this.workspace = workspace;
		this.enterprise_workspace = enterprise_workspace;
		this.channel = channel;
		this.token = token;
		this.enterprise_token = enterprise_token;
		
		// Derive combined variables
		if (workspace != enterprise_workspace) {
			this.workspace_path = `${enterprise_workspace}/${workspace}`;
		} else {
			this.workspace_path = workspace;
		}
		
		// Prepare variables to be used in the retrieval of data
		this.user_map = {};
		console.log("constructed..");
		this.messages = {};
		this.messages_with_replies = [];
	}
	
	// Retrieves a map of user IDs to their handles & names within the channel
	async populate_channel_info(with_replies=true) {
		let form_data = new FormData();
		form_data.append('token', this.token);
		form_data.append('no_self', 'true');
		form_data.append('count', '1000');
		form_data.append('channel', this.channel);

		console.log('token used with api: ' + this.token);
		console.log('channel used with api: ' + this.channel);
		
		let url = `https://app.slack.com/api/conversations.view`
		let options = {
            method: 'POST',
			mode: 'cors',
            body: form_data
        }

		let data = await fetch(url, options).then(response => response.text()).then(to_json => JSON.parse(to_json));
		
		// Defaults
		this.name = 'DM';
		this.creation = 0;
		
		// Overrides
		if ('channel' in data) {
			if ('name' in data.channel) {
				this.name = data.channel.name;
				this.creation = data.channel.created;
			}
		} else if ('group' in data) {
			this.name = data.group.name;
			this.creation = data.group.created;
		}
		
		// Populate the user map
		for (const user of data.users) {
			this.user_map[user.id] = {
				handle: user.name,
				name: user.profile.real_name
			};
		}
		
		// Populate the messages
		if (data.history.has_more) {
			console.log('Incomplete history! More than 1,000 messages in the channel.');
		}
		for (const message of data.history.messages.reverse()) {
			let user_name = this.get_user_name(message.user);
			let is_reply = ('thread_ts' in message) && (message['thread_ts'] != message['ts']);
			let timestamp = parseFloat(message.ts);
			let thread_id = 0;
			if (!is_reply) {
				thread_id = timestamp.toFixed(6);
			} else {
				let parent_timestamp = parseFloat(message.thread_ts);
				thread_id = parent_timestamp.toFixed(6);
			}
			let text = this.format_text(message.text, is_reply);
			let slack_message = new SlackMessage(user_name, timestamp, thread_id, text, is_reply);
			
			if (!is_reply) {
				console.log("called1");
				console.log(thread_id);
				console.log(slack_message);
				console.log(message);
				this.messages[thread_id] = slack_message;
			} else {
				console.log("called2");
				console.log(thread_id);
				console.log(slack_message);
				console.log(message);
				this.messages[thread_id].add_child(slack_message);
			}
		}
		
		if (with_replies) {
			await this.populate_messages_with_replies();
		}
	}
	
	// Adding replies into the messages
	async populate_messages_with_replies() {
		for (const [thread_id, message] of Object.entries(this.messages)) {
			this.messages_with_replies.push(message);
			for (const child of message.children) {
				this.messages_with_replies.push(child);
			}
		}
	}
	
	/// Helper functions
	// Text formatting
	format_text(text, is_reply) {
		// Replace any <@###>'s with @Alias [@handle]'s
		const AT_REGEX = RegExp('<@(\\w+)>', 'g')
		text = text.replace(AT_REGEX, (full_match, user_id) => `@${this.get_user_name(user_id)}`);
		
		// And the @here/@channel variants
		text = text.replace('<!here>', '@here').replace('<!channel>', '@channel');
		
		return text;
	}

	// Translate user IDs into user names and user handles
	get_user_name(user_id) {
		if (user_id in this.user_map) {
			return `${this.user_map[user_id].name} <${this.user_map[user_id].handle}>`;
		} else {
			return `{{unknown:${user_id}}}`;
		}
	}
}
