library(foreach)
library(doParallel)
library(doSNOW)

#setup parallel backend to use many processors


castList <- unique(unlist(data$cast, recursive = T))
cast <- as.data.frame(castList)
cast$count <- 0

getCount <- function(castName){
  ctn <- 0
  for(i in 1:nrow(data)){
    if(!identical(data[i, ]$cast[[1]], character(0))){
      if(contains(castName, data[i, ]$cast)){
        ctn <- ctn + 1
      }
    }
  }
  return(ctn)
}

cl <- makeCluster(11)
registerDoSNOW(cl)
iterations <- length(castList)
pb <- txtProgressBar(max = iterations, style = 3)
progress <- function(n) setTxtProgressBar(pb, n)
opts <- list(progress = progress)

c <- foreach(i=1:length(castList), .combine = rbind, .options.snow = opts) %dopar% {
  getCount(castList[i])
}

cast$count <- c
cast <- cast %>%
  arrange(desc(cast$count))

write.csv(cast, 'cast_count.csv', row.names = F)


close(pb)
#stop cluster
stopCluster(cl)

topCast <- head(cast$castList, 10)

writeCastCSV <- function(castName){
  print(castName)
  
  ids <- c()
  for(i in 1:nrow(data)){
    if(!identical(data[i, ]$cast[[1]], character(0))){
      if(contains(castName, data[i, ]$cast)){
        ids <- append(ids, data[i, ]$show_id)
      }
    }
  }
  
  id <- unique(ids)
  
  movies <- data %>%
    filter(data$show_id %in% id)
  
  from <- c() # the 'from' side of edges
  to <- c()   # the 'to' side of edges
  for(record in movies$cast){
    if(length(record) > 1){  # add to lists only if the record contains more than one cast
      for(i in 1:(length(record)-1)){
        for(j in (i + 1):length(record)){
          from <- append(from, record[i]) # append the names to the from and to lists
          to <- append(to,record[j])
        }
      }
    }
  }
  
  name <- unique(append(from, to))
  
  nodes <- as.data.frame(name)
  row.names(nodes) <- name
  nodes$id <- 0
  for(i in 1:nrow(nodes)){
    nodes[i, 'id'] <- i
  }
  
  links <- as.data.frame(from)
  links$to <- to
  links$target <- 0
  links$source <- 0
  for(i in 1:nrow(links)){
    links[i, 'source'] <- nodes[links[i, 'from'], 'id']
    links[i, 'target'] <- nodes[links[i, 'to'], 'id']
  }
  
  nodeFileName <- paste0('nodes_', castName, '.csv')
  linkFileName <- paste0('links_', castName, '.csv')
  
  write.csv(nodes, nodeFileName, row.names = F)
  write.csv(links, linkFileName, row.names = F)
}

for(name in topCast){
  writeCastCSV(name);
}
