start = Welcome {$first_name}, this is your all-in-one Telegram bot for seamless PDF communication using AI.

        <b>Free Tier:</b>
        • Upload 5 files/month (up to 20 pages each).
        • Real-time chat with PDFs.

        For advanced use, unlock premium features, use /subscription 

        <b>Premium Features:</b>
        • Voice Communication
        • Document Summarization
        • Extended File Storage: 25 files/month (max 100 pages)
        • Higher quality and faster responses
        • Priority support

        <b>File Lifecycle:</b> 30 days. Files are securely destroyed for privacy.
        <b>Maximum file size:</b> 20MB

        For support, contact us at pdf_chat_bot_support@proton.me

       • Write /help to display all available commands.
       • Write /about to display information about this bot.

       ⚠️ Bot still under development

       To start using this bot, simply submit a file

       Please choose default language:


back = ⬅️ Go back


help = 🤖 <b>PDF Telegram Bot Help</b>

        Welcome to the PDF Telegram Bot! Here are the available commands:

        <b>/start</b> - Start using the bot and get an introduction.

        <b>/settings</b> - Access and modify your bot settings.

        <b>/subscribe</b> - Subscribe for additional options.

        <b>/files</b> - Access and manage documents within the bot.

        <b>/about</b> - Get information about bot.

        <b>/leave</b> - To leave chat.

        <b>/help</b> - Display this help message.


about =
        Your all-in-one Telegram bot for seamless PDF communication using AI.

        <b>Free Tier:</b>
        • Upload 5 files/month (up to 20 pages each).
        • Real-time chat with PDFs.

        For advanced use, unlock premium features, use /subscription 

        <b>Premium Features:</b>
        • Voice Communication
        • Document Summarization
        • Extended File Storage: 25 files/month (max 100 pages)
        • Higher quality and faster responses
        • Priority support

        <b>File Lifecycle:</b> 30 days. Files are securely destroyed for privacy.
        <b>Maximum file size:</b> 20MB

        For support, contact us at pdf_chat_bot_support@proton.me

        Upgrade your PDF interaction on Telegram with our chat bot!


advice = Improve your experience! When communicating with PDFs in our bot, provide relevant keywords found in the text. 📚 This enhances accuracy, making interactions smoother. Your input matters for better results! 💡

# Payment description
payment_description = For larger projects with higher needs.
                      • 25 PDFs/mo included
                      • 100 pages per document
                      • Ability to communicate with a document using voice
                      • Ability to compress a document to create a summary
                      • Higher quality and faster responses
                      • Priority support
                      
# Payment titles
ONE_MONTH = 1 month subscription 
THREE_MONTH = 3 months subscription 🌟 (10% discount)
ONE_YEAR = 12 months subscription 🌟 (25% discount)


# Settings manage subscription 
subscription_manage = 🔄 Manage subscription

subscription_remaining = Your subscription will end in <b>{$remaining}</b> days

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
files_file_option = File - <b>{$file}</b>
files_next = ▶ 
files_prev = ◀

# CHAT
chat_enter = 💬 Entering chat with file <b>{$fileName}</b>:
chat_voice_large_warning = Sorry, your voice message is too large to process.
chat_command_warning = ⚠️ Your question should not start with <b>"/"</b>
                       Please try again

chat_message_type_warning = ⚠️ Please use text messages for optimal communication.
                            Voice messages are available if subscribed /subscribe.
                            Avoid sending images or files. 

chat_leave = ❌ Leave chat
chat_loader = 💡 Processing request... 
prepare_doc = ⏱️ Preparing the document...
chat_assistant = 🤖 <b>Assistant answer:</b>
chat_continue = <b>Continue:</b>


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

language_default = The default language is English - 🇺🇸

summarize_button = ✂️ Summarize 

chat_button = 💬 Chat

save_button = 💾 Save

advice_button = Hide this message

leave_mesasge = You have left the chat

error_message = Oops! It seems like something went wrong.

tooold_message = Apologies for inconvenience! Your recent action in the app couldn't be processed due to its age. Please refresh and try again. Thank you for your understanding.

refain_message = ⚠️ Please refrain from performing repetitive actions or spamming the bot! 

max_file_size_warning = ⚠️ The maximum file size should not exceed 20 MB
