start = Welcome {$first_name}, this is a bot for communicating with PDF documents.
       Write /help to display all available commands.

back = ⬅️ Go back

# Payment description
payment_description = For larger projects with higher needs.
                      • 25 PDFs/mo included
                      • 50 pages per document
                      • Ability to communicate with a document using voice
                      • Ability to compress a document to create a summary
                      • Higher quality and faster responses
                      • Priority support
                      
# Payment titles
ONE_MONTH = 1 month subscription
THREE_MONTH = 3 months subscription
ONE_YEAR = 12 months subscription


# Settings manage subscription 
subscription_manage = 🔄 Manage subscription

subscription_remaining = { $remainig -> 
                      [one] Your subscription will end in <b>{$remainig}</b> day
                      *[other] Your subscription will end in <b>{$remainig}</b> days
}

subscription_success  = You successfuly subscribed for 

subscription_warning = You are not subscribed!
                       Use /subscribe to see all available options

subscription_voice_warning = You are not subscribed to use this feature!
                       Use /subscribe to use voice communication

subscription_files_limit_warning = You've reached the maximum files for the month! 

subscription_free_files_limit_warning = You've reached the maximum files for the month!
                                   Upgrade by using /subscribe to increase your file limit.

subscription_pages_limit_warning = You've reached the maximum number pages per one file


subscription_free_pages_limit_warning = You've reached the maximum number pages per file allowed for the free tier!
                                   Upgrade by using /subscribe to increase your pages per file limit.


# FILES 
files_not_found = You don't have documents yet
files_already_exist = File already exsist!
files_pdf_only_warninig = The file must be in pdf format!
files_saved = File saved <b>{$fileName}</b>

# CHAT
chat_enter = 💬 Entering chat with file <b>{$fileName}</b>:
chat_voice_large_warning = Sorry, your voice message is too large to process.
chat_command_warning = Your question should not start with /!
                       Please try again

chat_loader = 💡 Processing request... 
chat_assistant = 🤖 Assistant answer:
# MENUS
files_menu_text = { $count -> 
                      [one] You have <b>{$count}</b> pdf document
                      *[other] You have <b>{$count}</b> pdf documents
}

interact_menu_text = Select what you want to do:

settings_menu_text = Settings menu:

providers_menu_text = You can subscribe using these methods:
subscription_menu_text = Choose what type of subscription you want:

language_menu_text = 🌐 Default language

language_default = The default language is English🇺🇸
