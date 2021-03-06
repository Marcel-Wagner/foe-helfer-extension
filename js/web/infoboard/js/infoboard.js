/*
 * **************************************************************************************
 *
 * Dateiname:                 infoboard.js
 * Projekt:                   foe-chrome
 *
 * erstellt von:              Daniel Siekiera <daniel.siekiera@gmail.com>
 * erstellt am:	              22.12.19, 14:31 Uhr
 * zuletzt bearbeitet:       22.12.19, 14:31 Uhr
 *
 * Copyright © 2019
 *
 * **************************************************************************************
 */

// Chat-Titel notieren
FoEproxy.addHandler('ConversationService', 'getEntities', (data, postData) => {
	MainParser.setConversations(data.responseData);
});

FoEproxy.addHandler('ConversationService', 'getTeasers', (data, postData) => {
	MainParser.setConversations(data.responseData);
});

FoEproxy.addHandler('ConversationService', 'getOverview', (data, postData) => {
	MainParser.setConversations(data.responseData);
});

let Infoboard = {

	InjectionLoaded: false,
	PlayInfoSound : null,
	SoundFile: new Audio(extUrl + 'vendor/sounds/ping.mp3'),


	/**
	 * Setzt einen ByPass auf den WebSocket und "hört" mit
	 */
	init: ()=> {

		let StorageHeader = localStorage.getItem('ConversationsHeaders');

		// wenn noch nichts drin , aber im LocalStorage vorhanden, laden
		if(MainParser.Conversations.length === 0 && StorageHeader !== null){
			MainParser.Conversations = JSON.parse(StorageHeader);
		}

		Infoboard.Box();

		if(Infoboard.InjectionLoaded === false){
			FoEproxy.addRawWsHandler(data => {
				if ($('#BackgroundInfo').length > 0) {
					Infoboard.BoxContent('in', data);
				}
			});
			Infoboard.InjectionLoaded = true;
		}
	},


	/**
	 * Erzeugt die Box wenn noch nicht im DOM
	 *
	 */
	Box: ()=> {

		// Wenn die Box noch nicht da ist, neu erzeugen und in den DOM packen
		if( $('#BackgroundInfo').length === 0 ){

			let spk = localStorage.getItem('infoboxTone');

			if(spk === null)
			{
				localStorage.setItem('infoboxTone', 'deactivated');
				Infoboard.PlayInfoSound = false;

			} else {
				Infoboard.PlayInfoSound = (spk !== 'deactivated');
			}

			HTML.Box({
				'id': 'BackgroundInfo',
				'title': i18n['Menu']['Info']['Title'],
				'auto_close': true,
				'dragdrop': true,
				'resize': true,
				'speaker': 'infoboxTone'
			});

			// CSS in den DOM prügeln
			HTML.AddCssFile('infoboard');
		}

		let div = $('#BackgroundInfo'),
			h = [];

		// Filter
		h.push('<div class="filter-row">');
		h.push('<span><strong>' + i18n['Boxes']['Infobox']['Filter'] + ':</strong></span>');

		h.push('<span><label class="game-cursor"><input type="checkbox" data-type="gex" class="filter-msg game-cursor" checked> ' + i18n['Boxes']['Infobox']['FilterGex'] + '</label></span>');
		h.push('<span><label class="game-cursor"><input type="checkbox" data-type="auction" class="filter-msg game-cursor" checked> ' + i18n['Boxes']['Infobox']['FilterAuction'] + '</label></span>');
		h.push('<span><label class="game-cursor"><input type="checkbox" data-type="message" class="filter-msg game-cursor" checked> ' + i18n['Boxes']['Infobox']['FilterMessage'] + '</label></span>');
		h.push('<span><label class="game-cursor"><input type="checkbox" data-type="level" class="filter-msg game-cursor" checked> ' + i18n['Boxes']['Infobox']['FilterLevel'] + '</label></span>');
		h.push('<span><label class="game-cursor"><input type="checkbox" data-type="trade" class="filter-msg game-cursor" checked> ' + i18n['Boxes']['Infobox']['FilterTrade'] + '</label></span>');

		h.push('<button class="btn btn-default btn-reset-box">' + i18n['Boxes']['Infobox']['ResetBox'] + '</button>');

		h.push('</div>');


		// Tabelle
		h.push('<table id="BackgroundInfoTable" class="foe-table">');

		h.push('<tbody></tbody>');

		h.push('</table>');

		div.find('#BackgroundInfoBody').html(h.join(''));

		div.show();

		Infoboard.FilterInput();
		Infoboard.ResetBox();

		$('body').on('click', '#infoboxTone', function(){

			let disabled = $(this).hasClass('deactivated');

			localStorage.setItem('infoboxTone', (disabled ? '' : 'deactivated') );
			Infoboard.PlayInfoSound = !!disabled;

			if(disabled === true) {
				$('#infoboxTone').removeClass('deactivated');
			} else {
				$('#infoboxTone').addClass('deactivated');
			}
		});
	},


	/**
	 * Setzt eine neue Zeile für die Box zusammen
	 *
	 * @param dir
	 * @param data
	 */
	BoxContent: (dir, data)=> {

		let Msg = data[0];

		if(Msg === undefined || Msg['requestClass'] === undefined){
			return ;
		}

		let c = Msg['requestClass'],
			m = Msg['requestMethod'],
			t = Msg['responseData']['type'] || '',
			s = c + '_' + m + t;

		// Gibt es eine Funktion dafür?
		if (Info[s] === undefined) {
			return;
		}

		let bd = Info[s](Msg['responseData']);

		if(bd === false){
			return;
		}

		let status = $('input[data-type="' + bd['class'] + '"]').prop('checked'),
			tr = $('<tr />').addClass(bd['class']),
			msg = bd['msg'];


		// wenn nicht angezeigt werden soll, direkt versteckeln
		if(status === false)
		{
			tr.hide();
		}

		tr.append(
			'<td>' + bd['type'] + '<br><small><em>' + moment().format('HH:mm:ss') + '</em></small></td>' +
			'<td>' + msg + '</td>'
		);

		$('#BackgroundInfoTable tbody').prepend(tr);

		if(Infoboard.PlayInfoSound && status !== false)
		{
			Infoboard.SoundFile.play();
		}
	},


	/**
	 * Filter für Message Type
	 *
	 */
	FilterInput: ()=>{

		$('body').on('change', '.filter-msg', function(){

			let active = [];

			$('.filter-msg').each(function(){
				if( $(this).is(':checked') )
				{
					active.push($(this).data('type'));
				}
			});

			$('#BackgroundInfoTable tbody tr').each(function(){
				let tr = $(this);
				type = tr.attr('class');

				if(active.includes(type))
				{
					tr.show();
				} else {
					tr.hide();
				}
			});
		});
	},


	/**
	 * Leert die Infobox, auf Wunsch
	 *
	 */
	ResetBox: ()=> {
		$('body').on('click', '.btn-reset-box', function(){
			$('#BackgroundInfoTable tbody').html('');
		});
	}
};


let Info = {

	/**
	 * Jmd hat in einer Auktion mehr geboten
	 *
	 * @param d
	 * @returns {{class: 'auction', msg: string, type: string}}
	 */
	ItemAuctionService_updateBid: (d)=> {
		return {
			class: 'auction',
			type: 'Auktion',
			msg: HTML.i18nReplacer(
				i18n['Boxes']['Infobox']['Messages']['Auction'],
				{
					'player' : d['player']['name'],
					'amount': HTML.Format(d['amount']),
				}
			)
		};
	},


	/**
	 * Nachricht von jemandem
	 *
	 * @param d
	 * @returns {{class: 'message', msg: string, type: string}}
	 */
	ConversationService_getNewMessage: (d)=> {
		let msg;

		if(d['text'] !== ''){
			msg = d['text'].replace(/(\r\n|\n|\r)/gm, '<br>');

		} else if(d['attachment'] !== undefined){

			// LG
			if(d['attachment']['type'] === 'great_building') {
				msg = HTML.i18nReplacer(
					i18n['Boxes']['Infobox']['Messages']['MsgBuilding'],
					{
						'building': BuildingNamesi18n[d['attachment']['cityEntityId']]['name'],
						'level': d['attachment']['level']
					}
				)
			}
			// Handel
			else if(d['attachment']['type'] === 'trade_offer'){
				msg = d['attachment']['offeredAmount'] + ' ' + GoodsData[d['attachment']['offeredResource']]['name'] +' &#187; ' + d['attachment']['neededAmount'] + ' ' + GoodsData[d['attachment']['neededResource']]['name'];
			}
		}

		return {
			class: 'message',
			type: 'Nachricht',
			msg: Info.GetConversationHeader(d['conversationId'], d['sender']['name']) + msg
		};
	},


	/**
	 * LG wurde gelevelt
	 *
	 * @param d
	 * @returns {{class: 'level', msg: string, type: string}}
	 */
	OtherPlayerService_newEventgreat_building_contribution: (d)=> {
		return {
			class: 'level',
			type: 'Level-Up',
			msg: HTML.i18nReplacer(
				i18n['Boxes']['Infobox']['Messages']['LevelUp'],
				{
					'player' : d['player']['name'],
					'building': d['great_building_name'],
					'level': d['attachment']['level'],
					'rank' : d['rank']
				}
			)
		};
	},


	/**
	 * Handel wurde angenommen
	 *
	 * @param d
	 * @returns {{class: 'trade', msg: string, type: string}}
	 */
	OtherPlayerService_newEventtrade_accepted:(d)=>{
		return {
			class: 'trade',
			type: i18n['Boxes']['Infobox']['FilterTrade'],
			msg: HTML.i18nReplacer(
				i18n['Boxes']['Infobox']['Messages']['Trade'],
				{
					'player' : d['other_player']['name'],
					'offer': GoodsData[d['offer']['good_id']]['name'],
					'offerValue': d['offer']['value'],
					'need': GoodsData[d['need']['good_id']]['name'],
					'needValue': d['need']['value']
				}
			)
		}
	},


	/**
	 * Ein Gildenmitglied hat in der GEX gekämpft
	 *
	 * @param d
	 * @returns {boolean|{msg: *, type: string, class: string}}
	 */
	GuildExpeditionService_receiveContributionNotification: (d)=> {

		// "mich" nicht anzeigen
		if(d['player']['player_id'] === ExtPlayerID) {
			return false;
		}

		return {
			class: 'gex',
			type: 'GEX',
			msg: HTML.i18nReplacer(
				i18n['Boxes']['Infobox']['Messages']['GEX'],
				{
					'player' : d['player']['name'],
					'points' : HTML.Format(d['expeditionPoints'])
				}
			)
		};
	},


	/**
	 * Sucht den Titel einer Nachricht heraus
	 *
	 * @param id
	 * @param {string} name
	 * @returns {string}
	 */
	GetConversationHeader: (id, name)=> {
		if(MainParser.Conversations.length > 0){
			let header = MainParser.Conversations.find(obj => (obj['id'] === id));

			if(header !== undefined){
				return '<div><strong style="color:#ffb539">' + header['title'] + '</strong> - <em>' + name + '</em></div>';
			}
		}

		else {
			return '<div><strong style="color:#ffb539">' + name + '</strong></div>';
		}

		return '';
	}
};