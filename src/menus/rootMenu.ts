import { BotContext } from "..";
import { Menu } from "@grammyjs/menu";
import { fileMenu, filesMenu } from "./filesMenu";
import { interactMenu } from "./intercatMenu";
import { settingsMenu } from "./settingsMenu";
import { providersMenu } from "./providersMenu";
import { disableAdviceMenu } from "./disableAdviceMenu";

export const rootMenu = new Menu<BotContext>("root");

rootMenu.register(filesMenu);
rootMenu.register(fileMenu);
rootMenu.register(interactMenu);
rootMenu.register(settingsMenu);
rootMenu.register(providersMenu);
rootMenu.register(disableAdviceMenu);
