package com.shapecodemaster.di

import android.content.Context
import androidx.room.Room
import com.shapecodemaster.data.local.CodeTableDataSource
import com.shapecodemaster.data.local.database.AppDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "shapecode_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    fun provideCharacterDao(database: AppDatabase) = database.characterDao()

    @Provides
    fun providePracticeRecordDao(database: AppDatabase) = database.practiceRecordDao()

    @Provides
    fun provideMistakeBookDao(database: AppDatabase) = database.mistakeBookDao()

    @Provides
    @Singleton
    fun provideCodeTableDataSource(@ApplicationContext context: Context): CodeTableDataSource {
        return CodeTableDataSource(context)
    }
}