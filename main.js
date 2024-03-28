const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

const snmp = require('net-snmp')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		//this.config = config
		this.configUpdated(config)

		this.updateStatus(InstanceStatus.Connecting)
	
		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions

		this.feedbackInterval = setInterval(() => {
			this.checkFeedbacks('ChannelState')
		}, 1000)
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
		clearInterval(this.feedbackInterval)
		if (this.sessionRead) {
			this.sessionRead.close()
		}
		if (this.sessionWrite) {
			this.sessionWrite.close()
		}		
	}

	async configUpdated(config) {
		this.config = config
		this.createSession()
	}

	async createSession() {
		if (this.sessionRead) {
			this.sessionRead.close()
		}
		if (this.sessionWrite) {
			this.sessionWrite.close()
		}

		let options = {
			port: this.config.port,
			version: snmp.Version1,
			backwardsGetNexts: true,
			idBitsSize: 32,
		}
		
		this.sessionRead = snmp.createSession(this.config.host, this.config.communityRead, options)
		this.sessionWrite = snmp.createSession(this.config.host, this.config.communityWrite, options)

		this.readStatus()
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'communityRead',
				label: 'Community read string',
				width: 6,
				default: 'public',
			},
			{
				type: 'textinput',
				id: 'communityWrite',
				label: 'Community write string',
				width: 6,
				default: 'private',
			},
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 6,
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'SNMP port',
				width: 6,
				default: '161',
				regex: Regex.Port,
			},			
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}

	async readStatus() {
		let self = this
		return new Promise((resolve, reject) => {
			const oid = "1.3.6.1.4.1.17420.1.2.9.1.13.0"
			self.sessionRead.get([oid], (error, varbinds) => {
				if (error) {
					//self.log('error', error.toString())
					self.updateStatus(InstanceStatus.ConnectionFailure)
					self.currentStatus = []
					// reject()
					resolve(self.currentStatus)
				} else {
					//self.log('info', `Result => ${JSON.stringify(varbinds)}`)
					let data = String.fromCharCode.apply(null, new Uint16Array(varbinds[0].value))
					self.currentStatus = data.split(",").map(s => parseInt(s))
					// self.log('info', `Current status: ${self.currentStatus.filter(s => s >= 0).join(", ")}`)
					self.updateStatus(InstanceStatus.Ok)
					resolve(self.currentStatus)
				}
			})
		})
	}

	async sendCommand(type, socket, value) {
		let self = this
		let currentStatus = await this.readStatus()
		let newStatus = [...currentStatus]
		// this.log('info', `Current status: ${currentStatus.join(", ")}`)
		if (type == "all") {
			newStatus = currentStatus.map(s => s >= 0 ? value: s)
		} else {
			newStatus[socket - 1] = value
		}
		// this.log('info', `New status: ${newStatus.join(", ")}`)
		return new Promise((resolve, reject) => {
			let varbinds = [
				{
					oid: "1.3.6.1.4.1.17420.1.2.9.1.13.0",
					type: snmp.ObjectType.OctetString,
					value: newStatus.join(",")
				}
			]

			self.sessionWrite.set(varbinds, (error, varbinds) => {
				if (error) {
					self.log('error', error.toString())
					self.updateStatus(InstanceStatus.ConnectionFailure)
					resolve()
				} else {
					self.updateStatus(InstanceStatus.Ok)
					resolve()
				}
			})
		})
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
