
// Beginning of primary logic for the extension; creates the SlackChannel object and begins all of the asynchronous population of its data before modifying it into a deliverable
async function main(info) {
	// Create the SlackChannel object and asynchronously populate its data; wait to complete
	let slack_channel = new SlackChannel(info.workspace, info.enterprise_workspace, info.channel, info.token, info.enterprise_token);
	await slack_channel.populate_channel_info();
	
	// Convert from slack channel messages into text
	let data = [];
	for (const message of slack_channel.messages_with_replies) {
		data.push(message.full_text);
	}
	
	let suggested_name = 'slack_logs.txt';
	
	// Supply it as a deliverable to be downloaded
	var blob = new Blob(data, {type: "text/plain"});
	var crafted_url = URL.createObjectURL(blob);
	chrome.downloads.download({
		'url': crafted_url,
		'filename': suggested_name,
		'saveAs': true
	});
}


// Entry Point: gets tab & slack information and calls main() with it
chrome.browserAction.onClicked.addListener(function(tab) {
	let url = tab.url;
	const URL_REGEX = new RegExp('https:\\/\\/[^\\.]*\\.?slack\\.com\\/client\\/([\\w]+)\\/([\\w]+)');
	let match = URL_REGEX.exec(url);
	let workspace = match[1];
	let channel = match[2];
	
	
	// Grab the slack information as well (i.e., from local storage)
	let code = {
		'code': 'localStorage.getItem("localConfig_v2")'
	}
	chrome.tabs.executeScript(tab.id, code, function(config_string) {
		let config = JSON.parse(config_string);
		let workspace_config = config.teams[workspace];
		let token = workspace_config.token;

		// IF there's an "enterprise API token" and an "enterprise workspace" get THOSE values as well
		let enterprise_token = '';
		let enterprise_workspace = '';

		if ('enterprise_name' in workspace_config) {
			enterprise_token = workspace_config.enterprise_api_token;
			enterprise_workspace = workspace_config.enterprise_id;
		} else {
			enterprise_token = token;
			enterprise_workspace = workspace;
		}

                console.log('token: ' + token);
                console.log('enterprise_token: ' + enterprise_token);
		
		data = {
			'workspace': workspace,
			'enterprise_workspace': enterprise_workspace,
			'channel': channel,
			'token': token,
			'enterprise_token': enterprise_token
		};
		main(data);
	});
});
