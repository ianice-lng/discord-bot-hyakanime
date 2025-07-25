const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {logoUrl, urlEndpoint} = require("../config.json");
const diffuseurEmoji = require("../diffuseurEmoji.json");
module.exports = {
    data: new SlashCommandBuilder()
        .setName("agenda")
        .setDescription("Fournit l'agenda du jour.")
        .addStringOption((option) =>
            option
                .setName("type")
                .setDescription("Agenda afficher par Jour ou Semaine ?")
                .setRequired(false)
                .addChoices(
                    { name: "Jour", value: "day" },
                    { name: "Semaine", value: "timeline" }
                )
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });
        const type = interaction.options.getString("type") || "day";
        const result = await fetch(`${urlEndpoint}/agenda/${type}`);
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
            .setURL("https://hyakanime.fr/agenda")

        if(type === "day") {
            const listAnime = response.map((anime) => ({
                ...anime,
                timestamp: Number(anime.episode.timestamp),
            })).sort((a, b) => a.timestamp - b.timestamp);
            embed.setTitle(`Agenda du Jour`);
            
            for(anime of listAnime) {
                if(!anime.episode.displayCalendar) return
                const date = new Date(anime.episode.timestamp);
                const timeString = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
                let diffuseur = "";
                if(anime.media.diffuseur) {
                    //une simple vérification pour voir si le fichier diffuseurEmoji.json est rempli ou pas (si vous modifiez un texte dans le fichier ça ira dans le if)
                    if(diffuseurEmoji["Crunchyroll"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["Disney"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["Netflix"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["ADN"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["Prime"] !== "REMPLIR AVEC UN EMOJI") {
                        diffuseur = await getDiffuseurEmoji(anime.media.diffuseur);
                         // Pour éviter les problèmes de rate limit
                    }
                }
                embed.addFields({
                    name: `**${timeString}**`,
                    value:`${diffuseur} ${anime.episode.animeTitle ? anime.episode.animeTitle.length > 12 ? anime.episode.animeTitle.substring(0, 13) + "..." : anime.episode.animeTitle : anime.media.title ? anime.media.title.length > 12 ? anime.media.title.substring(0, 14) + "..." : anime.media.title : anime.media.romanji ? anime.media.romanji.length > 12 ? anime.media.romanji.substring(0, 14) + "..." : anime.media.romanji : anime.media.titleJP ? anime.media.titleJP.length > 12 ? anime.media.titleJP.substring(0, 14) + "..." : anime.media.titleJP : "Titre inconnu"} - ${anime.episode.title}`}
                );
            }
        }else if(type === "timeline") {
            embed.setTitle(`Agenda de la Semaine`);
            const week = [[], [], [], [], [], [], []];
            for (let j = 0; j < response.length; j++) {
                const listAnime = response[j].airing
                for (let i = 0; i < listAnime.length; i++) {
                    const anime = listAnime[i];
                    if(!anime.displayCalendar) return
                    const date = new Date(anime.timestamp);
                    const timeString = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
                    
                    let info = {
                        name: `${anime.animeTitle ? anime.animeTitle.length > 12 ? anime.animeTitle.substring(0, 13) + "..." : anime.animeTitle : anime.media.title ? anime.media.title.length > 12 ? anime.media.title.substring(0, 14) + "..." : anime.media.title : anime.media.romanji ? anime.media.romanji.length > 12 ? anime.media.romanji.substring(0, 14) + "..." : anime.media.romanji : anime.media.titleJP ? anime.media.titleJP.length > 12 ? anime.media.titleJP.substring(0, 14) + "..." : anime.media.titleJP : "Titre inconnu"}`,
                        value: `Ep ${anime.number}`,
                        timestamp: `**${timeString}**`,
                        date: `${date.toLocaleDateString("fr-FR", { weekday: "long" }).charAt(0).toUpperCase() + date.toLocaleDateString("fr-FR", { weekday: "long" }).slice(1)} ${date.getDate()} ${date.toLocaleDateString("fr-FR", { month: "long" })}`,
                    }
                    if(anime.media.diffuseur) {

                        //une simple vérification pour voir si le fichier diffuseurEmoji.json est rempli ou pas (si vous modifiez un texte dans le fichier ça ira dans le if)
                        if(diffuseurEmoji["Crunchyroll"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["Disney"] !== "REMPLIR AVEC UN EMOJI" ||diffuseurEmoji["Netflix"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["ADN"] !== "REMPLIR AVEC UN EMOJI" || diffuseurEmoji["Prime"] !== "REMPLIR AVEC UN EMOJI") {
                            info.diffuseur = await getDiffuseurEmoji(anime.media.diffuseur);
                        }
                    }
                    

                    week[j].push(info);
                };
            }
            week.map((day) => {
                if(day.length === 0) return
                let length = 0;
                const listIndex = []
                embed.addFields({
                    name: `${day[0].date}`,
                    value: day.map((anime, index) => {
                        length += `${anime.timestamp} - ${anime.name} - ${anime.value} ${anime?.diffuseur ? `- ${anime.diffuseur}` : ""}`.length
                        if(length > 950){
                            listIndex.push(index);
                            return null
                        }
                        return`${anime.timestamp} - ${anime.name} - ${anime.value} ${anime?.diffuseur ? `- ${anime.diffuseur}` : ""}`
                    }).join("\n")
                });
                if(listIndex.length > 0) {
                    embed.addFields({
                        name: `${day[0].date} (suite)`,
                        value: listIndex.map((index) => {
                            return `${day[index].timestamp} - ${day[index].name} - ${day[index].value} ${day[index]?.diffuseur ? `- ${day[index].diffuseur}` : ""}`
                        }).join("\n")
                    });
                }
            });
        }

        interaction.editReply({ embeds: [embed] });
    }
};


async function getDiffuseurEmoji(listDiffuseur) {
        let emoji = "";
        Object.keys(listDiffuseur).map((key) => {
            if (diffuseurEmoji[key] === undefined) return;
            emoji += `${diffuseurEmoji[key]}`;
        });
        return emoji;
}