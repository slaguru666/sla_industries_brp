import { BRPCheck } from "../apps/check.mjs"
import { OPCard } from "./opposed-card.mjs"

export class GRCard {

  //Add a new skill to a Combined Card
  static async GRAdd(config, msgId) {
    if (game.user.isGM) {
      let targetMsg = await game.messages.get(msgId)
      if (!targetMsg) return
      const flags = BRPCheck.getChatFlags(targetMsg)
      const currentCards = Array.isArray(flags.chatCard) ? [...flags.chatCard] : []
      if ((currentCards).length >= 5 && (flags.cardType === 'GR' || flags.cardType === 'CO')) {
        ui.notifications.warn(game.i18n.localize('BRP.resolveMax'))
        return
      } else if ((currentCards).length >= 2 && flags.cardType === 'OP') {
        ui.notifications.warn(game.i18n.localize('BRP.resolveMax'))
        return
      }

      let newChatCards = currentCards
      newChatCards.push(config.chatCard[0])
      const nextFlags = {
        ...flags,
        chatCard: newChatCards
      }
      await targetMsg.update(BRPCheck.getChatFlagUpdate(nextFlags))
      const pushhtml = await BRPCheck.startChat(nextFlags)
      await targetMsg.update({ content: pushhtml })
    } else {
      const availableGM = game.users.find(d => d.active && d.isGM)?.id
      if (availableGM) {
        game.socket.emit('system.sla-industries-brp', {
          type: 'GRAdd',
          to: availableGM,
          value: { config, msgId }
        })
      } else {
        ui.notifications.warn(game.i18n.localize('BRP.noAvailableGM'))
      }
    }
  }


  //Remove a skill from a combined card
  static async GRRemove(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    if (!targetMsg) return
    const flags = BRPCheck.getChatFlags(targetMsg)
    let rank = config.dataset.rank
    let newChatCards = Array.isArray(flags.chatCard) ? [...flags.chatCard] : []
    newChatCards.splice(rank, 1)
    const nextFlags = {
      ...flags,
      chatCard: newChatCards
    }
    await targetMsg.update(BRPCheck.getChatFlagUpdate(nextFlags))
    const pushhtml = await BRPCheck.startChat(nextFlags)
    await targetMsg.update({ content: pushhtml })
    return
  }


  //Resolve a combined card - roll dice, update and close
  static async GRResolve(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    if (!targetMsg) return
    let flags = BRPCheck.getChatFlags(targetMsg)
    let chatCards = Array.isArray(flags.chatCard) ? [...flags.chatCard] : []
    let cardType = flags.cardType
    if (chatCards.length < 2) {
      ui.notifications.warn(game.i18n.localize('BRP.resolveMore'))
      return
    }

    let newchatCards = []
    let roll = new Roll(chatCards[0].rollFormula)
    await roll.evaluate()
    let rollResult = Number(roll.result)

    let diceRolled = ""
    for (let diceRoll = 0; diceRoll < roll.dice.length; diceRoll++) {
      for (let thisDice = 0; thisDice < roll.dice[diceRoll].values.length; thisDice++) {
        if (thisDice != 0 || diceRoll != 0) {
          diceRolled = diceRolled + ", "
        }
        diceRolled = diceRolled + roll.dice[diceRoll].values[thisDice]
      }
    }

    let successes = 0
    for (let i of chatCards) {
      i.rollResult = rollResult
      i.diceRolled = diceRolled
      i.rollVal = rollResult
      i.resultLevel = await BRPCheck.successLevel({
        targetScore: i.targetScore,
        rollVal: i.rollVal,
        cardType,
      })
      if (i.resultLevel > 1) { successes++ }
      i.resultLabel = game.i18n.localize('BRP.resultLevel.' + i.resultLevel)
      newchatCards.push(i)
    }
    //await OPCard.showDiceRoll(chatCards[0])
    successes = successes / chatCards.length
    flags = {
      ...flags,
      chatCard: newchatCards,
      state: 'closed',
      successLevel: successes,
      rollResult
    }
    await targetMsg.update({
      ...BRPCheck.getChatFlagUpdate(flags),
      'rolls': [roll]
    })
    const pushhtml = await BRPCheck.startChat(flags)
    await targetMsg.update({ content: pushhtml })
    await BRPCheck.tickXP(flags)
    return
  }

  static async GRClose(config) {
    let targetMsg = await game.messages.get(config.targetChatId)
    if (!targetMsg) return
    const flags = BRPCheck.getChatFlags(targetMsg)
    const nextFlags = {
      ...flags,
      state: 'closed',
      successLevel: -1,
      chatCard: []
    }
    await targetMsg.update(BRPCheck.getChatFlagUpdate(nextFlags))
    const pushhtml = await BRPCheck.startChat(nextFlags)
    await targetMsg.update({ content: pushhtml })
    return
  }
}
