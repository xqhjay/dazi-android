mod achievements;
mod commands;
mod db;
mod mastery;
mod models;
mod stats;

use db::DbState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_haptics::init())
        .setup(|app| {
            // 初始化数据库
            let conn = db::open_db(app.handle())?;
            app.handle().manage(DbState(std::sync::Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::record_session,
            commands::get_streak,
            commands::get_stats_summary,
            commands::get_wpm_trend,
            commands::get_daily_stats,
            commands::get_char_mastery,
            commands::get_achievements,
            commands::get_high_score,
            commands::get_setting,
            commands::get_all_settings,
            commands::set_setting,
        ])
        .run(tauri::generate_context!())
        .expect("error while running 字速");
}
