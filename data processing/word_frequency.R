# import related libraryies
library(dplyr)        # used for group by, sum, etc..
library(ggplot2)      #
library(wordcloud2)   #
library(gsubfn)       #
library(tm)           #
library(circlize)     #
library(igraph)       #

setwd('~/Downloads')

data <- read.csv('netflix_titles.csv')

# Change the data type in solarData 
data$date_added <- as.Date(data$date_added, "%B %d, %Y") # change data type of date column
data$rating <- as.factor(data$rating)                    # change data type of rating column to factor values

# remove the spaces after commas
data$cast <- gsub(",\\s", ",", data$cast)
data$cast <- strsplit(data$cast,",")
# replace the origin column values with a new two-dimension list
data$cast <- as.list(data$cast)


# remove the spaces after commas
data$country <- gsub(",\\s", ",", data$country)
# split the value with comma
data$country <- strsplit(data$country, ',')
# replace the origin column values with a new two-dimension list
data$country <- as.list(data$country)


# remove the spaces after commas
data$listed_in <- gsub(",\\s", ",", data$listed_in)
# split the value with comma
data$listed_in <- strsplit(data$listed_in, ',')
# replace the origin column values with a new two-dimension list
data$listed_in <- as.list(data$listed_in)


# Remove description column
data <- data[-12]

################################################################################
#                                 Data cleaning                                #
################################################################################
# Empty Factors
a <- data %>%
  count(rating)
m <- ggplot(data = a, aes(x = rating, y=n)) +
  geom_col()+
  geom_text(aes(label = n), vjust = -0.8)
# replace "" value in rating column to "known"
levels(data$rating)[1] <- "Unknown"

# Anonymous directors
b <- data %>%
  count(data$director == "")
colnames(b) <- c("Anonymous", "count")

view <- ggplot(b, aes(x="", y=count,fill=Anonymous))+
  geom_bar(stat = "identity", width = 1) +
  coord_polar("y", start=0)+
  geom_text(aes(label = count, hjust = -1, vjust = -2))
view
data$director <- replace(data$director, data$director=="", "Anonymous")

# Unknown countries
data[identical(data$country,character(0))]

genreList <- data$listed_in
genreList <- unlist(genreList, T)
genreList <- unique(genreList)
genreCount <- as.data.frame(genreList)
genreCount$count <- 0

for(i in 1:length(genreList)){
  for(j in 1:nrow(data)){          # iterate through the whole dataset
    li <- data[j,]$listed_in
    if(contains(genreList[i],li)){ # use the contains function to check the listed in column
      genreCount[i,'count'] <- genreCount[i,'count'] + 1 # self add 1 if its TRUE
    }
  }
}

#sort genre count list based of count
genreCount <- genreCount %>%
  arrange(desc(count))

# get the highest observation (most popular genre)
genreTop10 <- head(genreCount,10)

genreList <- genreTop10$genreList
genreList <- sort(genreList, decreasing = F)

contains <- function(g, li){
  for(i in 1:length(li[[1]])){
    if(g == li[[1]][i]){
      return(T)
    }
  }
  return(F)
}

res <- data.frame()

for(i in 1:length(genreList)){
  titles <- list()
  for(j in 1:nrow(data)){
    li <- data[j, ]$listed_in
    if(contains(genreList[i], li)){
      titles <- append(titles, data[j, ]$title)
    }
  }
  docs <- Corpus(VectorSource(titles))
  docs <- docs %>%
    tm_map(removeNumbers) %>%
    tm_map(removePunctuation) %>%
    tm_map(stripWhitespace)
  docs <- tm_map(docs, content_transformer(tolower))
  docs <- tm_map(docs, removeWords, stopwords("english"))
  dtm <- TermDocumentMatrix(docs)
  matrix <- as.matrix(dtm) 
  words <- sort(rowSums(matrix),decreasing=TRUE) 
  df <- data.frame(word = names(words),freq=words)
  df <- head(df, 1000)
  df$genre <- genreList[i]
  res <- rbind(res, df)
}

titles <- data$title
docs <- Corpus(VectorSource(titles))
docs <- docs %>%
  tm_map(removeNumbers) %>%
  tm_map(removePunctuation) %>%
  tm_map(stripWhitespace)
docs <- tm_map(docs, content_transformer(tolower))
docs <- tm_map(docs, removeWords, stopwords("english"))
dtm <- TermDocumentMatrix(docs)
matrix <- as.matrix(dtm) 
words <- sort(rowSums(matrix),decreasing=TRUE) 
df <- data.frame(word = names(words),freq=words)
df <- head(df, 1000)
df$genre <- 'All'
res <- rbind(res, df)

write.csv(genreList, 'genre.csv', row.names = F)
write.csv(res, 'word_frequency.csv', row.names = F)




country <- data$country
country <- unlist(country, recursive = T)
country <- unique(country)

country <- as.data.frame(country)
country$count <- 0

for(i in 1:length(country$country)){
  for(j in 1:nrow(data)){          # iterate through the whole dataset
    li <- data[j,]$country
    if(!identical(li[[1]], character(0))){
      if(contains(country[i, ]$country,li)){ # use the contains function to check the listed in column
        country[i,'count'] <- country[i,'count'] + 1 # self add 1 if its TRUE
      }
    }
  }
}

country <- country %>%
  arrange(desc(count))
countryList <- head(country, 10)


countryList <- countryList$country

all_countries <- country$country

country_matrix <- data.frame(matrix(0, nrow=length(all_countries), ncol = length(all_countries)))
colnames(country_matrix) <- all_countries
rownames(country_matrix) <- all_countries

for(record in data$country){ # iterate through whole data set
  if(length(record) == 1){   # if the record only created by one country, directly modify the matrix
    country_matrix[record, record] <- country_matrix[record, record] + 1
  }else if(length(record) > 1){
    for(i in 1:length(record)){   # use two pointer to iterate through the record's country list
      for(j in i:length(record)){
        # modify the matrix based on two countries
        country_matrix[record[i],record[j]] <- country_matrix[record[i],record[j]] + 1
        country_matrix[record[j],record[i]] <- country_matrix[record[j],record[i]] + 1
      }
    }
  }
}

outputMatrix <- country_matrix[countryList, countryList]
write.csv(outputMatrix, 'country_matrix.csv', row.names = F)








