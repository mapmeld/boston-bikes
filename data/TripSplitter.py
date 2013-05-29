# TripSplitter

from datetime import datetime

trips = open('trips.csv', 'r')

firstline = trips.readline()
nowdate = None
nowdatelines = [ ]
startindex = 0

while(True):
  tripline = trips.readline()
  startindex = startindex + 1
  date = tripline.split(',')[3].split(' ')[0]
  
  if(date == nowdate):
    # currently loading trips that start on this day
    nowdatelines.append( tripline )
  else:
    if nowdate is not None:
      # finished loading trips in progress on nowdate, make a CSV for it
      op = open('trips/' + nowdate + '.csv', 'w')
      op.write(firstline)
      for line in nowdatelines:
        op.write(line)
      op.close()
      
    # prepare to load trips in progress for date (which becomes the new nowdate)
    nowdate = date
    print nowdate
    nowdatelines = [ ]

    # read in all trips in progress before today, which end today or in the future
    innerindex = 0
    catchendtrips = open('trips.csv', 'r')
    catchendtrips.readline()
    midnight = datetime.strptime(date + ' 0:00:00','%Y-%m-%d %H:%M:%S')
    while(True):
      innerindex = innerindex + 1
      if(innerindex >= startindex):
        break
      
      endline = catchendtrips.readline()
      enddate = endline.split(',')[5]
      enddate = enddate[:enddate.rfind('-0')]
      #print enddate
      enddate = datetime.strptime(enddate,'%Y-%m-%d %H:%M:%S')
      if(enddate > midnight):
        nowdatelines.append(endline)
    
    catchendtrips.close()
  
    nowdatelines.append( tripline )