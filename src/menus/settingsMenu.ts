import { Menu } from "@grammyjs/menu";
import { BotContext } from "..";
import { languageMenu } from "./languageMenu";
import { subscriptionMenu } from "./subcriptionMenu";

export const settingsMenu = new Menu<BotContext>("settings")
  .submenu("Default language", "language")
  .row()
  .submenu("Manage subscription", "subscription");

// register all submenus
settingsMenu.register(languageMenu);
settingsMenu.register(subscriptionMenu);
