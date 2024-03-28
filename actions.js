module.exports = function (self) {
	self.setActionDefinitions({
		switchOn: {
			name: 'Set Output Socket On',
			options: [
				{
					type: 'number',
					label: 'Socket',
					id: 'socketOn',
					min: 1,
					max: 24,
					default: 1,
					required: true,
				},
			],
			callback: async function(event) {
				let options = event.options;
				await self.sendCommand('individual', options.socketOn, 1);
				self.checkFeedbacks('ChannelState')
			}
		},

		switchOff: {
			name: 'Set Output Socket Off',
			options: [
				{
					type: 'number',
					label: 'Socket',
					id: 'socketOff',
					min: 1,
					max: 24,
					default: 1,
					required: true,
				},
			],
			callback: async function(event) {
				let options = event.options;
				await self.sendCommand('individual', options.socketOff, 0);
				self.checkFeedbacks('ChannelState')
			}
		},

		allOn: {
			name: 'Set All Sockets On',
			options: [],
			callback: async function(event) {
				await self.sendCommand('all', null, 1);
				self.checkFeedbacks('ChannelState')
			}
		},

		allOff: {
			name: 'Set All Sockets Off',
			options: [],
			callback: async function(event) {
				await self.sendCommand('all', null, 0);
				self.checkFeedbacks('ChannelState')
			}
		}		
	})
}
