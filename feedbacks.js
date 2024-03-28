const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		ChannelState: {
			name: 'Socket State',
			type: 'boolean',
			label: 'Channel State',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'num',
					type: 'number',
					label: 'Socket',
					default: 1,
					min: 1,
					max: 24,
				},
			],
			callback: async (feedback) => {
				try {
					let status = await self.readStatus()
					if (!feedback) {
						return null
					}
					// console.log('Hello world!', feedback.options.num)
					let result = status[feedback.options.num - 1] || -1;
					// console.log('Feedback result', result)
					return (result == 1)
				} catch (e) {
					return null
				}
			},
		},
	
	})
}