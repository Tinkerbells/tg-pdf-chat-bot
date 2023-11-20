import { BotContext } from "..";
import { Menu } from "@grammyjs/menu";
import { filesMenu } from "./filesMenu";
import { interactMenu } from "./intercatMenu";
import { settingsMenu } from "./settingsMenu";
import { providersMenu } from "./providersMenu";
import { leaveMenu } from "./leaveMenu";
import { startMenu } from "./startMenu";
import { disableAdviceMenu } from "./disableAdviceMenu";

export const rootMenu = new Menu<BotContext>("root");

rootMenu.register(filesMenu);
rootMenu.register(interactMenu);
rootMenu.register(settingsMenu);
rootMenu.register(providersMenu);
rootMenu.register(leaveMenu);
rootMenu.register(startMenu);
rootMenu.register(disableAdviceMenu);
