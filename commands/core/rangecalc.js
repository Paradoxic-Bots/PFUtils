const { SlashCommandBuilder } = require('@discordjs/builders');
const { RoleManager } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rangecalc')
		.setDescription('Calculates Hits to kill ranges!')
		.addStringOption((option) =>
			option.setName('damage').setDescription('Damage of the gun (Eg: 44 - 23).').setRequired(true)
		)
		.addStringOption((option) =>
			option.setName('range').setDescription('Ranges of the gun (Eg: 70 - 200).').setRequired(true)
		)
		.addNumberOption((option) =>
			option.setName('torsomulti').setDescription('Torso Multiplier of the gun (Eg: 1.25)').setRequired(true)
		)
		.addNumberOption((option) =>
			option.setName('headmulti').setDescription('Headshot Multiplier of the gun (Eg: 2.0)').setRequired(true)
		),

	async execute(interaction, client) {
		function rangeCalculator(a, b, hitsToKillConstant, torsoMulti, headMulti) {
			const slope = (a.y - b.y) / (a.x - b.x);

			let range = (slope * -a.x + a.y - hitsToKillConstant) * -(1 / slope);
			let torsoRange =
				(slope * torsoMulti * -a.x + a.y * torsoMulti - hitsToKillConstant) * -(1 / (slope * torsoMulti));
			let headRange = (slope * headMulti * -a.x + a.y * headMulti - hitsToKillConstant) * -(1 / (slope * headMulti));

			range = range < a.x ? 0 : range;
			torsoRange = torsoRange < a.x ? 0 : torsoRange;
			headRange = headRange < a.x ? 0 : headRange;

			range = range >= b.x ? `Infinite` : range.toFixed(2);
			torsoRange = torsoRange >= b.x ? `Infinite` : torsoRange.toFixed(2);
			headRange = headRange >= b.x ? `Infinite` : headRange.toFixed(2);

			return { range, torsoRange, headRange };
		}

		const range = interaction.options.getString('range').replaceAll(' ', '').split('-', 2);
		const damage = interaction.options.getString('damage').replaceAll(' ', '').split('-', 2);

		const torsoMulti = interaction.options.getNumber('torsomulti');
		const headMulti = interaction.options.getNumber('headmulti');

		const a = { x: parseInt(range[0]), y: parseInt(damage[0]) };
		const b = { x: parseInt(range[1]), y: parseInt(damage[1]) };

		if (!a.x || !a.y || !b.x || !b.y)
			return interaction.reply({
				embeds: [
					{
						title: 'Range or Damage invalid.',
						description: 'Expected Syntax:\n`/rangecalc damage:44-23 range:70-200 torsomulti:1.1 headmulti:1.5`',
						color: client.config.settings.color,
						timestamp: new Date(),
						footer: { text: client.config.settings.footer },
					},
				],
			});

		let buildArray = [];
		let hitsToKillConstants = [100, 50, 33.34, 25, 20];

		hitsToKillConstants.forEach((constant) => {
			const range = rangeCalculator(a, b, constant, torsoMulti, headMulti);

			let hitKill = 0;

			switch (constant) {
				case 100:
					hitKill = 1;
					break;
				case 50:
					hitKill = 2;
					break;
				case 33.34:
					hitKill = 3;
					break;
				case 25:
					hitKill = 4;
					break;
				case 20:
					hitKill = 5;
					break;
			}

			let buildObj = {
				name: `${hitKill} Hit Kill Range`,
				value: `Limb Range: \`${range.range}\` studs.\nTorso Range: \`${range.torsoRange}\` studs.\nHead Range: \`${range.headRange}\` studs.`,
			};

			if (range.range == 0 && range.torsoRange == 0 && range.headRange == 0) return;
			if (
				range.range.includes('Infinite') &&
				range.torsoRange.includes('Infinite') &&
				range.headRange.includes('Infinite')
			)
				return;

			buildArray.push(buildObj);
		});

		await interaction.reply({
			embeds: [
				{
					title: 'Range Calculator',
					description: 'Calculate hits to kill ranges for any gun.',
					fields: [buildArray],
					color: client.config.settings.color,
					timestamp: new Date(),
					footer: { text: client.config.settings.footer },
				},
			],
		});
	},
};
