import requests 
url = "https://www.biblegateway.com/passage/?search=Romans+8:5&version=lsg"

response = requests.get(url)
print(response.status_code)
print(response.text)    

