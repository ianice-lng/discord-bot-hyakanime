const { Events, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require("discord.js");
const fetch = require("node-fetch");
const { logoUrl, urlEndpoint } = require("../config.json");
const { fetchUser } = require("../function/user.js");
module.exports = {
    name: Events.MessageCreate,
    async execute(msg) {
        if (msg.author.bot) return;
        if (msg.content === null) return;
        msg.content = msg.content.toLowerCase();
        if (!msg.content.includes("://")) return;
        const message = msg.content;
        const regex = /https?:\/\/[^\s]+/g;
        const link = message.match(regex)[0];
        if (!link) return;
        let info = link.replace("https://", "").replace("http://", "").replace("www.", "").split("/");
        if (info[0] === "hyakanime.fr") {
            if (info[1] === "anime") {
                if (info[2] === undefined || info[2] === "") return;
                let buttonClicked = false;
                const result = await fetch(`${urlEndpoint}/anime/${info[2]}`);
                const data = await result.text();
                const response = JSON.parse(data);
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "hyakanime",
                        iconURL:
                            logoUrl,
                        url: "https://hyakanime.fr",
                    })
                    .setColor("#0099ff")
                    .setTitle(response.title ? response.title : response.titleEN ? response.titleEN : response.romanji ? response.romanji : response.titleJP)
                    .setURL(`https://hyakanime.fr/anime/${response.id}`)

                    .setTimestamp();
                if (!response.adult) {
                    embed.setDescription(response.synopsis === undefined ? "Pas de synopsis renseigné." : response.synopsis.slice(0, 200) + "...")
                    if(response.image !== undefined){
                        embed.setThumbnail(response.image)
                    }
                } else {
                    embed.setDescription("Ce contenu est réservé à un public averti.")
                }
                await msg.suppressEmbeds(true);
                if(response.adult){
                    await msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
                    return;
                }
                const button = new ButtonBuilder()
                    .setStyle(ButtonStyle.Secondary)
                    .setLabel("Voir plus...")
                    .setEmoji("👀")
                    .setCustomId(`animeButton_${response.id}_${msg.id}`);

                const message = await msg.reply({ embeds: [embed], allowedMentions: { repliedUser: false }, components: [new ActionRowBuilder().addComponents(button)] });
                const collector = msg.channel.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 30000, // durée du bouton 
                    filter: (i) => i.customId === `animeButton_${response.id}_${msg.id}`,
                });

                collector.on('collect', async i => {
                    
                    if (!buttonClicked) {
                        const newEmbed =new EmbedBuilder()
                        .setAuthor({
                            name: "hyakanime",
                            iconURL:
                                logoUrl,
                            url: "https://hyakanime.fr",
                        })
                        .setColor("#0099ff")
                        .setTitle(response.title ? response.title : response.titleEN ? response.titleEN : response.romanji ? response.romanji : response.titleJP)
                        .setURL(`https://hyakanime.fr/anime/${response.id}`)
                        .setTimestamp()
                        .setDescription(response.synopsis === undefined ? "Pas de synopsis renseigné." : response.synopsis)
                        Object.keys(response).forEach((key) => {
                            switch (key) {
                                case "image":
                                    newEmbed.setImage(response[key])
                                    break;
                                case "genre":
                                    newEmbed.addFields(
                                        { name: 'Genres', value: response[key] === undefined || response[key].length < 1 ? "Pas de genres renseignés." : response[key].join(", "), inline: true })
                                    break;
                                case "NbEpisodes":
                                    newEmbed.addFields(
                                        { name: 'Nombre d\'épisodes', value: response[key] === undefined || response[key] === null ? "0" : `${response[key]}`,  inline: true })
                                    break;
                                case "vf":
                                    newEmbed.addFields(
                                        { name: "VF", value: response[key] === undefined ? response[key] ? "Oui" : "Non" : "Non", inline: true})
                                    break;
                                case "studios":
                                    newEmbed.addFields(
                                        { name: "Studios", value: response[key] === undefined ? "Pas de studio renseigné" : response[key], inline: true})
                                    break;
                                case "source":
                                    newEmbed.addFields(
                                        { name: "Sources", value: response[key] === undefined ? "Pas de source renseigné" : response[key], inline: true})
                                    break;
                                case "diffuseur":
                                    let diffuseurs = []
                                    Object.keys(response[key]).forEach((name) => {
                                        diffuseurs.push(`[${name}](${response[key][name]})`)
                                    })
                                    newEmbed.addFields(
                                        { name: `Diffuseur${response[key].length > 1 ? "s": ""}`, value: diffuseurs.join(', '), inline: true })
                                    break;
                                case "status":
                                    let status = ""
                                    switch (response[key]) {
                                        case 1:
                                            status = "En cours"
                                            break;
                                        case 2:
                                            status = "À venir"
                                            break;
                                        case 3:
                                            status = "Diffusion terminé"
                                            break;
                                        case 4:
                                            status = "Annulé"
                                            break;
                                        default:
                                            status = "Pas de status renseigné."
                                            break;
                                    }
                                    newEmbed.addFields(
                                        { name: 'Status', value: response[key] === undefined ? "Pas de status renseigné." : status,  inline: true })
                                    break;
                                case "start":
                                    newEmbed.addFields(
                                        { name: 'Date de sortie', value: `${response[key].day === null || response[key].day === undefined ? "" : response[key].day+ "/"}${response[key].month === null || response[key].month === undefined ? "" : response[key].month+ "/"}${response[key].year === null || response[key].year === undefined ? "" : response[key].year}`, inline: true },)
                                    break;
                                case "end":
                                    if (response[key].year !== null) {
                                        newEmbed.addFields(
                                            { name: 'Date de fin', value: `${response[key].day === null || response[key].day === undefined ? "" : response[key].day + "/"}${response[key].month === null || response[key].month === undefined ? "" : response[key].month + "/"}${response[key].year === null || response[key].year === undefined ? "" : response[key].year}`, inline: true },)
                                    }
                                    break;
                                default:
                                    break;
                            }
                        });
                        if(msg.author.id === i.user.id){
                            button.setLabel("Voir moins...")
                            await i.update({ embeds: [newEmbed], components: [new ActionRowBuilder().addComponents(button)] });
                            buttonClicked = !buttonClicked;
                        }else{
                            i.reply({ embeds: [newEmbed], components: [], ephemeral: true });
                        }
                        
                    } else {
                        if(msg.author.id === i.user.id){
                            button.setLabel("Voir plus...")
                            await i.update({ embeds: [embed], components: [new ActionRowBuilder().addComponents(button)] });
                            buttonClicked = !buttonClicked;
                        }else{
                            i.reply({ embeds: [embed], components: [], ephemeral: true });
                        }
                    }
                });
                collector.on('end', async () => {
                    await message.edit({ components: [] });
                });
            } else if (info[1] === "user") {
                if (info[2] === undefined || info[2] === "") return;
                let pseudo = info[2];
                const { userEmbed, attachment } = await fetchUser(pseudo, EmbedBuilder, AttachmentBuilder);
                if (userEmbed == null) {
                    return;
                }

                await msg.suppressEmbeds(true);
                await msg.reply({ embeds: [userEmbed], allowedMentions: { repliedUser: false }, files: [attachment] });
            }
        }
    }
}
